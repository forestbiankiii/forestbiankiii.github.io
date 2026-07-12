/** WebGPU feature detection, cached so all glass surfaces share one device. */
export interface WebGPUDetectResult {
  supported: boolean;
  reason?: string;
  adapter?: GPUAdapter;
  device?: GPUDevice;
}

let cachedResult: WebGPUDetectResult | null = null;
let detectPromise: Promise<WebGPUDetectResult> | null = null;

export function detectWebGPU(): Promise<WebGPUDetectResult> {
  if (cachedResult) return Promise.resolve(cachedResult);
  if (detectPromise) return detectPromise;

  detectPromise = (async () => {
    if (!navigator.gpu) {
      cachedResult = {
        supported: false,
        reason: "WebGPU API not available",
      };
      return cachedResult;
    }

    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        cachedResult = { supported: false, reason: "No GPU adapter found" };
        return cachedResult;
      }
      const device = await adapter.requestDevice();
      cachedResult = { supported: true, adapter, device };
      return cachedResult;
    } catch (error) {
      cachedResult = {
        supported: false,
        reason: error instanceof Error ? error.message : "Unknown WebGPU error",
      };
      return cachedResult;
    }
  })();

  return detectPromise;
}
