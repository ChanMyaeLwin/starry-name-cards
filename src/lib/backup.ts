import type { Contact } from "./contact";
function run<T>(data: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./backup.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (e) => {
      worker.terminate();
      if (e.data.error) reject(new Error(e.data.error));
      else resolve(e.data.result);
    };
    worker.onerror = () => {
      worker.terminate();
      reject(new Error("Could not process this backup. Try a smaller file."));
    };
    worker.postMessage(data);
  });
}
export const parseBackupAsync = (text: string) =>
  run<Contact[]>({ action: "parse", text });
export const createBackupAsync = (cards: Contact[], photos: boolean) =>
  run<string>({ action: "backup", cards, photos });
export const exportVCardsAsync = (cards: Contact[]) =>
  run<string>({ action: "vcf", cards });
