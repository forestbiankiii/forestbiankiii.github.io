/*
 * WebGPU multipass renderer adapted from iyinchao/liquid-glass-studio (MIT).
 * The pass topology and bindings follow upstream; buffers are retained and
 * rewritten instead of allocated every frame because this site renders more
 * than one persistent glass surface.
 */

import type {
  IMultiPassRenderer,
  RenderPassConfig,
} from "./RendererInterface";

declare const GPUTextureUsage: {
  COPY_SRC: number;
  COPY_DST: number;
  RENDER_ATTACHMENT: number;
  TEXTURE_BINDING: number;
};
declare const GPUBufferUsage: {
  COPY_DST: number;
  STORAGE: number;
  UNIFORM: number;
  VERTEX: number;
};
declare const GPUShaderStage: {
  FRAGMENT: number;
};

type PassType = "bg" | "blur" | "main";

function detectPassType(config: RenderPassConfig): PassType {
  if (config.name === "bgPass") return "bg";
  if (config.name === "vBlurPass" || config.name === "hBlurPass") {
    return "blur";
  }
  return "main";
}

class GPUFrameBuffer {
  private texture: GPUTexture;

  constructor(
    private readonly device: GPUDevice,
    private width: number,
    private height: number,
  ) {
    this.texture = this.createTexture();
  }

  private createTexture() {
    return this.device.createTexture({
      size: [this.width, this.height],
      format: "rgba16float",
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
  }

  get colorTexture() {
    return this.texture;
  }

  get colorView() {
    return this.texture.createView();
  }

  resize(width: number, height: number) {
    if (this.width === width && this.height === height) return;
    this.texture.destroy();
    this.width = width;
    this.height = height;
    this.texture = this.createTexture();
  }

  dispose() {
    this.texture.destroy();
  }
}

class GPURenderPassObject {
  private readonly pipeline: GPURenderPipeline;
  private readonly vertexBuffer: GPUBuffer;
  private readonly bindGroupLayout: GPUBindGroupLayout;
  private readonly frameBuffer: GPUFrameBuffer | null;
  readonly passType: PassType;

  constructor(
    private readonly device: GPUDevice,
    readonly config: RenderPassConfig,
    canvasFormat: GPUTextureFormat,
    width: number,
    height: number,
  ) {
    this.passType = detectPassType(config);
    this.vertexBuffer = device.createBuffer({
      size: 8 * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(
      this.vertexBuffer,
      0,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    );

    this.bindGroupLayout = this.createBindGroupLayout();
    const shaderModule = device.createShaderModule({
      code: `${config.shader.vertex}\n${config.shader.fragment}`,
    });
    const outputFormat = config.outputToScreen
      ? canvasFormat
      : ("rgba16float" as GPUTextureFormat);

    this.pipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({
        bindGroupLayouts: [this.bindGroupLayout],
      }),
      vertex: {
        module: shaderModule,
        entryPoint: "vs_main",
        buffers: [
          {
            arrayStride: 2 * Float32Array.BYTES_PER_ELEMENT,
            attributes: [
              { shaderLocation: 0, offset: 0, format: "float32x2" },
            ],
          },
        ],
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fs_main",
        targets: [
          {
            format: outputFormat,
            blend: config.outputToScreen
              ? {
                  color: {
                    srcFactor: "one",
                    dstFactor: "one-minus-src-alpha",
                    operation: "add",
                  },
                  alpha: {
                    srcFactor: "one",
                    dstFactor: "one-minus-src-alpha",
                    operation: "add",
                  },
                }
              : undefined,
          },
        ],
      },
      primitive: { topology: "triangle-strip" },
    });

    this.frameBuffer = config.outputToScreen
      ? null
      : new GPUFrameBuffer(device, width, height);
  }

  private createBindGroupLayout() {
    if (this.passType === "blur") {
      return this.device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: { type: "uniform" },
          },
          {
            binding: 1,
            visibility: GPUShaderStage.FRAGMENT,
            texture: { sampleType: "float" },
          },
          {
            binding: 2,
            visibility: GPUShaderStage.FRAGMENT,
            sampler: {},
          },
          {
            binding: 3,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: { type: "read-only-storage" },
          },
        ],
      });
    }

    if (this.passType === "main") {
      return this.device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: { type: "uniform" },
          },
          {
            binding: 1,
            visibility: GPUShaderStage.FRAGMENT,
            texture: { sampleType: "float" },
          },
          {
            binding: 2,
            visibility: GPUShaderStage.FRAGMENT,
            texture: { sampleType: "float" },
          },
          {
            binding: 3,
            visibility: GPUShaderStage.FRAGMENT,
            sampler: {},
          },
        ],
      });
    }

    return this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: "float" },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: {},
        },
      ],
    });
  }

  render(
    encoder: GPUCommandEncoder,
    targetView: GPUTextureView | null,
    bindGroup: GPUBindGroup,
  ) {
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.frameBuffer?.colorView ?? targetView!,
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.draw(4);
    pass.end();
  }

  getOutputTexture() {
    return this.frameBuffer?.colorTexture ?? null;
  }

  getBindGroupLayout() {
    return this.bindGroupLayout;
  }

  resize(width: number, height: number) {
    this.frameBuffer?.resize(width, height);
  }

  dispose() {
    this.frameBuffer?.dispose();
    this.vertexBuffer.destroy();
  }
}

const MAIN_UNIFORM_BUFFER_SIZE = 176;
const BLUR_UNIFORM_BUFFER_SIZE = 16;
const BLUR_WEIGHT_COUNT = 201;

export class GPUMultiPassRenderer implements IMultiPassRenderer {
  private readonly context: GPUCanvasContext;
  private readonly canvasFormat: GPUTextureFormat;
  private readonly sampler: GPUSampler;
  private readonly passes: GPURenderPassObject[];
  private readonly passByName = new Map<string, GPURenderPassObject>();
  private readonly uniformBuffers = new Map<string, GPUBuffer>();
  private readonly blurWeightsBuffer: GPUBuffer;
  private readonly placeholderTexture: GPUTexture;
  private globalUniforms: Record<string, unknown> = {};

  constructor(
    canvas: HTMLCanvasElement,
    configs: RenderPassConfig[],
    private readonly device: GPUDevice,
    copySource = false,
  ) {
    const context = canvas.getContext("webgpu" as never) as
      | GPUCanvasContext
      | null;
    if (!context) throw new Error("WebGPU context not available");
    this.context = context;
    this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
      device,
      format: this.canvasFormat,
      alphaMode: "premultiplied",
      usage: copySource
        ? GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
        : GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.sampler = device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
      addressModeU: "clamp-to-edge",
      addressModeV: "clamp-to-edge",
    });
    this.placeholderTexture = device.createTexture({
      size: [1, 1],
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    device.queue.writeTexture(
      { texture: this.placeholderTexture },
      new Uint8Array([0, 0, 0, 255]),
      { bytesPerRow: 4 },
      [1, 1],
    );

    this.passes = configs.map(
      (config) =>
        new GPURenderPassObject(
          device,
          config,
          this.canvasFormat,
          canvas.width,
          canvas.height,
        ),
    );
    this.passes.forEach((pass) => this.passByName.set(pass.config.name, pass));

    for (const pass of this.passes) {
      const size =
        pass.passType === "blur"
          ? BLUR_UNIFORM_BUFFER_SIZE
          : MAIN_UNIFORM_BUFFER_SIZE;
      this.uniformBuffers.set(
        pass.config.name,
        device.createBuffer({
          size,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        }),
      );
    }
    this.blurWeightsBuffer = device.createBuffer({
      size: BLUR_WEIGHT_COUNT * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
  }

  resize(width: number, height: number) {
    this.passes.forEach((pass) => pass.resize(width, height));
  }

  setUniforms(uniforms: Record<string, unknown>) {
    Object.assign(this.globalUniforms, uniforms);
  }

  render(passUniforms: Record<string, Record<string, unknown>> = {}) {
    const encoder = this.device.createCommandEncoder();
    const targetView = this.context.getCurrentTexture().createView();

    for (const pass of this.passes) {
      const uniforms = {
        ...this.globalUniforms,
        ...(passUniforms[pass.config.name] ?? {}),
      };
      const inputTextures: Record<string, GPUTexture> = {};
      for (const [uniformName, passName] of Object.entries(
        pass.config.inputs ?? {},
      )) {
        const texture = this.passByName.get(passName)?.getOutputTexture();
        if (texture) inputTextures[uniformName] = texture;
      }
      const bindGroup = this.buildBindGroup(pass, uniforms, inputTextures);
      pass.render(
        encoder,
        pass.config.outputToScreen ? targetView : null,
        bindGroup,
      );
    }

    this.device.queue.submit([encoder.finish()]);
  }

  private buildBindGroup(
    pass: GPURenderPassObject,
    uniforms: Record<string, unknown>,
    inputs: Record<string, GPUTexture>,
  ) {
    const uniformBuffer = this.uniformBuffers.get(pass.config.name)!;

    if (pass.passType === "blur") {
      const data = new ArrayBuffer(BLUR_UNIFORM_BUFFER_SIZE);
      const floats = new Float32Array(data);
      const integers = new Int32Array(data);
      const resolution = (uniforms.u_resolution as number[]) ?? [1, 1];
      floats[0] = resolution[0] ?? 1;
      floats[1] = resolution[1] ?? 1;
      integers[2] = (uniforms.u_blurRadius as number) ?? 1;
      this.device.queue.writeBuffer(uniformBuffer, 0, data);

      const weights = new Float32Array(BLUR_WEIGHT_COUNT);
      weights.set(
        ((uniforms.u_blurWeights as number[]) ?? [1]).slice(
          0,
          BLUR_WEIGHT_COUNT,
        ),
      );
      this.device.queue.writeBuffer(this.blurWeightsBuffer, 0, weights);
      return this.device.createBindGroup({
        layout: pass.getBindGroupLayout(),
        entries: [
          { binding: 0, resource: { buffer: uniformBuffer } },
          {
            binding: 1,
            resource: (
              inputs.u_prevPassTexture ?? this.placeholderTexture
            ).createView(),
          },
          { binding: 2, resource: this.sampler },
          { binding: 3, resource: { buffer: this.blurWeightsBuffer } },
        ],
      });
    }

    this.writeMainUniformBuffer(uniformBuffer, uniforms);
    if (pass.passType === "main") {
      return this.device.createBindGroup({
        layout: pass.getBindGroupLayout(),
        entries: [
          { binding: 0, resource: { buffer: uniformBuffer } },
          {
            binding: 1,
            resource: (
              inputs.u_blurredBg ?? this.placeholderTexture
            ).createView(),
          },
          {
            binding: 2,
            resource: (inputs.u_bg ?? this.placeholderTexture).createView(),
          },
          { binding: 3, resource: this.sampler },
        ],
      });
    }

    const backgroundTexture =
      (uniforms.u_bgTexture as GPUTexture | undefined) ??
      this.placeholderTexture;
    return this.device.createBindGroup({
      layout: pass.getBindGroupLayout(),
      entries: [
        { binding: 0, resource: { buffer: uniformBuffer } },
        { binding: 1, resource: backgroundTexture.createView() },
        { binding: 2, resource: this.sampler },
      ],
    });
  }

  private writeMainUniformBuffer(
    buffer: GPUBuffer,
    uniforms: Record<string, unknown>,
  ) {
    const data = new ArrayBuffer(MAIN_UNIFORM_BUFFER_SIZE);
    const f32 = new Float32Array(data);
    const i32 = new Int32Array(data);
    const resolution = (uniforms.u_resolution as number[]) ?? [1, 1];
    const mouse = (uniforms.u_mouse as number[]) ?? [0, 0];
    const mouseSpring = (uniforms.u_mouseSpring as number[]) ?? [0, 0];
    const shadowPosition = (uniforms.u_shadowPosition as number[]) ?? [0, 0];
    const tint = (uniforms.u_tint as number[]) ?? [1, 1, 1, 0];
    const shape1Position = (uniforms.u_shape1Pos as number[]) ?? [0, 0];

    f32[0] = resolution[0] ?? 1;
    f32[1] = resolution[1] ?? 1;
    f32[2] = (uniforms.u_dpr as number) ?? 1;
    f32[4] = mouse[0] ?? 0;
    f32[5] = mouse[1] ?? 0;
    f32[6] = mouseSpring[0] ?? 0;
    f32[7] = mouseSpring[1] ?? 0;
    f32[8] = (uniforms.u_shapeWidth as number) ?? 200;
    f32[9] = (uniforms.u_shapeHeight as number) ?? 200;
    f32[10] = (uniforms.u_shapeRadius as number) ?? 80;
    f32[11] = (uniforms.u_shapeRoundness as number) ?? 5;
    f32[12] = (uniforms.u_mergeRate as number) ?? 0.05;
    f32[13] = (uniforms.u_glareAngle as number) ?? 0;
    f32[14] = (uniforms.u_shadowExpand as number) ?? 25;
    f32[15] = (uniforms.u_shadowFactor as number) ?? 0.15;
    f32[16] = shadowPosition[0] ?? 0;
    f32[17] = shadowPosition[1] ?? 0;
    f32[18] = (uniforms.u_bgTextureRatio as number) ?? 1;
    i32[19] = (uniforms.u_bgType as number) ?? 4;
    i32[20] = (uniforms.u_bgTextureReady as number) ?? 1;
    i32[21] = (uniforms.u_showShape1 as number) ?? 0;
    i32[22] = (uniforms.u_blurRadius as number) ?? 1;
    i32[23] = (uniforms.u_blurEdge as number) ?? 1;
    f32[24] = tint[0] ?? 1;
    f32[25] = tint[1] ?? 1;
    f32[26] = tint[2] ?? 1;
    f32[27] = tint[3] ?? 0;
    f32[28] = (uniforms.u_refThickness as number) ?? 20;
    f32[29] = (uniforms.u_refFactor as number) ?? 1.4;
    f32[30] = (uniforms.u_refDispersion as number) ?? 7;
    f32[31] = (uniforms.u_refFresnelRange as number) ?? 30;
    f32[32] = (uniforms.u_refFresnelHardness as number) ?? 0.2;
    f32[33] = (uniforms.u_refFresnelFactor as number) ?? 0.2;
    f32[34] = (uniforms.u_glareRange as number) ?? 30;
    f32[35] = (uniforms.u_glareHardness as number) ?? 0.2;
    f32[36] = (uniforms.u_glareConvergence as number) ?? 0.5;
    f32[37] = (uniforms.u_glareOppositeFactor as number) ?? 0.8;
    f32[38] = (uniforms.u_glareFactor as number) ?? 0.9;
    f32[40] = shape1Position[0] ?? 0;
    f32[41] = shape1Position[1] ?? 0;
    f32[42] = (uniforms.u_shape1Radius as number) ?? 0;

    this.device.queue.writeBuffer(buffer, 0, data);
  }

  dispose() {
    this.passes.forEach((pass) => pass.dispose());
    this.uniformBuffers.forEach((buffer) => buffer.destroy());
    this.uniformBuffers.clear();
    this.blurWeightsBuffer.destroy();
    this.placeholderTexture.destroy();
    this.globalUniforms = {};
  }
}

export function createCanvasGPUTexture(
  device: GPUDevice,
  width: number,
  height: number,
) {
  return device.createTexture({
    size: [width, height],
    format: "rgba8unorm",
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
  });
}

export function uploadCanvasToGPUTexture(
  device: GPUDevice,
  texture: GPUTexture,
  source: HTMLCanvasElement,
) {
  device.queue.copyExternalImageToTexture(
    { source, flipY: false },
    { texture },
    [source.width, source.height],
  );
}
