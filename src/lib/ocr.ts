import { assetURL, getOfflineStatus, type OCRLanguage } from "./offline";
let activeWorker: Worker | undefined;
let operation = 0;
let rejectCancelled: ((reason: DOMException) => void) | undefined;
export function cancelOCR() {
  operation++;
  rejectCancelled?.(new DOMException("Reading cancelled", "AbortError"));
  rejectCancelled = undefined;
  activeWorker?.terminate();
  activeWorker = undefined;
}
export async function recognizeImages(
  images: string[],
  language: OCRLanguage,
  onProgress: (progress: number, status: string) => void,
): Promise<string> {
  cancelOCR();
  if (!images.length) throw new Error("Choose a card photo before reading.");
  const current = operation;
  const cancelled = new Promise<never>((_, reject) => {
    rejectCancelled = reject;
  });
  const work = async () => {
    const ready = await getOfflineStatus();
    if (current !== operation)
      throw new DOMException("Reading cancelled", "AbortError");
    if (language.split("+").some((lang) => !ready[lang as "eng" | "mya"])) {
      throw new Error(
        "Download the selected OCR language in Settings first, or enter the details manually.",
      );
    }
    onProgress(0, "Starting on-device text recognition");
    const worker = new Worker(new URL("./ocr.worker.ts", import.meta.url), {
      type: "module",
    });
    activeWorker = worker;
    return new Promise<string>((resolve, reject) => {
      worker.onmessage = (
        event: MessageEvent<{
          type: string;
          progress: number;
          status: string;
          text: string;
          message: string;
        }>,
      ) => {
        if (current !== operation) return;
        if (event.data.type === "progress")
          onProgress(event.data.progress, event.data.status);
        if (event.data.type === "result") {
          onProgress(1, "Reading complete. Please check the details.");
          resolve(event.data.text);
        }
        if (event.data.type === "error") reject(new Error(event.data.message));
      };
      worker.onerror = () =>
        reject(
          new Error(
            "The local recognition engine could not start. Please retry, or enter details manually.",
          ),
        );
      worker.postMessage({ images, language, base: assetURL("./") });
    });
  };
  try {
    return await Promise.race([work(), cancelled]);
  } finally {
    if (current === operation) {
      rejectCancelled = undefined;
      activeWorker?.terminate();
      activeWorker = undefined;
    }
  }
}
