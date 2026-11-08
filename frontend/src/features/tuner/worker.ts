import { detect } from "./pitch";
self.onmessage = (
  event: MessageEvent<{ input: Float32Array; rate: number }>,
) => {
  self.postMessage(detect(event.data.input, event.data.rate));
};
