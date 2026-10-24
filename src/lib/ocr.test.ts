import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("./offline", () => ({
  assetURL: (path: string) => new URL(path, "https://example.test/cards/").href,
  getOfflineStatus: vi.fn(async () => ({ eng: true, mya: false })),
}));
import { cancelOCR, recognizeImages } from "./ocr";
import { getOfflineStatus } from "./offline";
class OwnerWorker {
  static instances: OwnerWorker[] = [];
  onmessage?: (event: { data: unknown }) => void;
  onerror?: () => void;
  terminate = vi.fn();
  postMessage = vi.fn();
  constructor() {
    OwnerWorker.instances.push(this);
  }
}
beforeEach(() => {
  OwnerWorker.instances = [];
  vi.stubGlobal("Worker", OwnerWorker);
});
afterEach(() => {
  cancelOCR();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
describe("OCR cancellation and unavailable packs", () => {
  it("terminates the owner worker even before engine initialization completes", async () => {
    const pending = recognizeImages(
      ["data:image/png;base64,example"],
      "eng",
      vi.fn(),
    );
    const rejection = expect(pending).rejects.toMatchObject({
      name: "AbortError",
    });
    await Promise.resolve();
    expect(OwnerWorker.instances).toHaveLength(1);
    cancelOCR();
    await rejection;
    expect(OwnerWorker.instances[0].terminate).toHaveBeenCalledOnce();
  });
  it("does not start a worker when the selected pack is unavailable", async () => {
    await expect(
      recognizeImages(["data:image/png;base64,example"], "mya", vi.fn()),
    ).rejects.toThrow("Download the selected OCR language");
    expect(OwnerWorker.instances).toHaveLength(0);
  });
  it("does not create a worker if cancelled while checking readiness", async () => {
    let finish: (
      value: Awaited<ReturnType<typeof getOfflineStatus>>,
    ) => void = () => {};
    vi.mocked(getOfflineStatus).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const pending = recognizeImages(
      ["data:image/png;base64,example"],
      "eng",
      vi.fn(),
    );
    const rejection = expect(pending).rejects.toMatchObject({
      name: "AbortError",
    });
    cancelOCR();
    finish({
      online: true,
      shell: true,
      eng: true,
      mya: false,
      englishBytes: 1,
      myanmarBytes: 1,
    });
    await rejection;
    expect(OwnerWorker.instances).toHaveLength(0);
  });
});
