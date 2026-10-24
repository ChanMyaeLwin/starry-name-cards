import {
  createBackup,
  parseBackup,
  exportVCards,
  type Contact,
} from "./contact";
self.onmessage = (
  event: MessageEvent<{
    action: "parse" | "backup" | "vcf";
    text?: string;
    cards?: Contact[];
    photos?: boolean;
  }>,
) => {
  try {
    const { action, text, cards, photos } = event.data;
    const result =
      action === "parse"
        ? parseBackup(text || "")
        : action === "vcf"
          ? exportVCards(cards || [])
          : createBackup(cards || [], photos);
    self.postMessage({ result });
  } catch (e) {
    self.postMessage({ error: (e as Error).message });
  }
};
