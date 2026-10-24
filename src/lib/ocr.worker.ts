import { createWorker, PSM } from "tesseract.js";
import type { OCRLanguage } from "./offline";
// This owner worker makes initialization cancellable too: terminating its parent
// context also terminates the dedicated Tesseract worker it owns.
self.onmessage = async (
  event: MessageEvent<{
    images: string[];
    language: OCRLanguage;
    base: string;
  }>,
) => {
  const { images, language, base } = event.data;
  let worker: Awaited<ReturnType<typeof createWorker>> | undefined;
  let imageIndex = 0;
  try {
    worker = await createWorker(language, 1, {
      workerPath: new URL("ocr/worker.min.js", base).href,
      corePath: new URL("ocr/core/", base).href,
      langPath: new URL("ocr/lang", base).href,
      workerBlobURL: false,
      cacheMethod: "none",
      gzip: false,
      logger: (event) =>
        self.postMessage({
          type: "progress",
          progress:
            event.status === "recognizing text"
              ? (imageIndex + event.progress) / images.length
              : 0,
          status:
            event.status === "recognizing text"
              ? `Reading side ${imageIndex + 1} of ${images.length}`
              : "Loading local recognition engine",
        }),
    });
    await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
    const results: string[] = [];
    for (imageIndex = 0; imageIndex < images.length; imageIndex++) {
      const { data } = await worker.recognize(images[imageIndex]);
      results.push(data.text.trim());
    }
    self.postMessage({ type: "result", text: results.join("\n\n") });
  } catch {
    // Do not expose image paths, recognized data, or engine diagnostics.
    self.postMessage({
      type: "error",
      message:
        "The card could not be read. Try a clearer photo, check your language download, or enter details manually.",
    });
  } finally {
    await worker?.terminate();
  }
};
