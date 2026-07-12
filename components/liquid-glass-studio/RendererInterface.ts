/*
 * Shared renderer contract adapted from iyinchao/liquid-glass-studio (MIT).
 * It lets the component keep one render loop while selecting WebGPU or WebGL2.
 */

export interface RenderPassConfig {
  name: string;
  shader: {
    vertex: string;
    fragment: string;
  };
  inputs?: Record<string, string>;
  outputToScreen?: boolean;
}

export interface IMultiPassRenderer {
  resize(width: number, height: number): void;
  setUniforms(uniforms: Record<string, unknown>): void;
  render(passUniforms?: Record<string, Record<string, unknown>>): void;
  dispose(): void;
}
