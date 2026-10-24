export type OCRLanguage = "eng" | "mya" | "eng+mya";
type Asset = { path: string; bytes: number; sha256: string };
type Manifest = { version: string; assets: Asset[] };
export type OfflineStatus = {
  online: boolean;
  shell: boolean;
  eng: boolean;
  mya: boolean;
  englishBytes: number;
  myanmarBytes: number;
};
const base = new URL(import.meta.env.BASE_URL, location.href).href;
const prefix = `starry-${base}`;
let registration: ServiceWorkerRegistration | undefined;
let downloadController: AbortController | undefined;
let downloadTask: Promise<void> | undefined;
export const assetURL = (path: string) => new URL(path, base).href;
async function manifest(): Promise<Manifest> {
  const response = await fetch(assetURL("ocr/manifest.json"));
  if (!response.ok)
    throw new Error(
      "OCR files are not available. Please connect and try again.",
    );
  const data = (await response.json()) as Manifest;
  const mandatory = [
    "ocr/worker.min.js",
    "ocr/lang/eng.traineddata",
    "ocr/lang/mya.traineddata",
    ...[
      "",
      "-lstm",
      "-simd",
      "-simd-lstm",
      "-relaxedsimd",
      "-relaxedsimd-lstm",
    ].flatMap((variant) => [
      `ocr/core/tesseract-core${variant}.wasm`,
      `ocr/core/tesseract-core${variant}.wasm.js`,
    ]),
  ];
  if (
    !/^[a-f0-9]{16}$/.test(data.version) ||
    !Array.isArray(data.assets) ||
    !mandatory.every((path) =>
      data.assets.some((asset) => asset.path === path),
    ) ||
    data.assets.some(
      (asset) =>
        !/^ocr\/(?:worker\.min\.js|core\/[a-z.-]+|lang\/(?:eng|mya)\.traineddata)$/.test(
          asset.path,
        ) ||
        !Number.isSafeInteger(asset.bytes) ||
        asset.bytes <= 0 ||
        !/^[a-f0-9]{64}$/.test(asset.sha256),
    )
  ) {
    throw new Error(
      "The OCR asset list is incomplete. Please reconnect and update the app.",
    );
  }
  return data;
}
type AppManifest = { version: string; assets: string[] };
async function appManifest(signal?: AbortSignal): Promise<AppManifest> {
  const response = await fetch(assetURL("app-assets.json"), { signal });
  if (!response.ok)
    throw new Error(
      "The app files are unavailable. Connect and retry offline preparation.",
    );
  const data = (await response.json()) as AppManifest;
  if (
    !/^[a-f0-9]{16}$/.test(data.version) ||
    !Array.isArray(data.assets) ||
    data.assets.length > 1000 ||
    !["index.html", "ocr/manifest.json"].every((path) =>
      data.assets.includes(path),
    ) ||
    data.assets.some(
      (path) =>
        typeof path !== "string" ||
        !/^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*$/.test(path) ||
        path.split("/").some((segment) => segment === "." || segment === ".."),
    )
  ) {
    throw new Error(
      "The app asset list is invalid. Reconnect and update the app before preparing offline use.",
    );
  }
  return data;
}
function shellPaths(app: AppManifest) {
  return [...new Set([...app.assets, "app-assets.json", "./"])];
}
async function hasShell(cache: Cache, app: AppManifest) {
  const responses = await Promise.all(
    shellPaths(app).map((path) =>
      cache.match(assetURL(path), { ignoreVary: true }),
    ),
  );
  return responses.every((response) => response?.ok);
}
async function prepareShell(
  signal: AbortSignal,
  onProgress: (progress: number, status: string) => void,
) {
  // Vite's development server has no generated shell manifest.
  if (import.meta.env.DEV && !navigator.serviceWorker?.controller) return;
  onProgress(0, "Preparing the app for offline use");
  const app = await appManifest(signal);
  const shell = await caches.open(`${prefix}shell-${app.version}`);
  for (const path of shellPaths(app)) {
    signal.throwIfAborted();
    if ((await shell.match(assetURL(path), { ignoreVary: true }))?.ok) continue;
    const response =
      path === "app-assets.json"
        ? Response.json(app)
        : await fetch(assetURL(path), { signal, cache: "reload" });
    if (!response.ok || response.redirected)
      throw new Error(
        "An app file could not be downloaded. Reconnect and retry offline preparation.",
      );
    signal.throwIfAborted();
    await shell.put(assetURL(path), response);
  }
  if (!(await hasShell(shell, app)))
    throw new Error(
      "Some app files are missing from browser storage. Please retry offline preparation.",
    );
}
function requiredAssets(data: Manifest, language: OCRLanguage) {
  return data.assets.filter(
    (a) =>
      !a.path.startsWith("ocr/lang/") ||
      language.split("+").some((l) => a.path === `ocr/lang/${l}.traineddata`),
  );
}
async function hasAssets(cache: Cache, assets: Asset[]) {
  for (const asset of assets) {
    const cached = await cache.match(assetURL(asset.path));
    if (!cached || cached.headers.get("x-starry-sha256") !== asset.sha256)
      return false;
  }
  return true;
}
export async function getOfflineStatus(): Promise<OfflineStatus> {
  const status: OfflineStatus = {
    online: navigator.onLine,
    shell: false,
    eng: false,
    mya: false,
    englishBytes: 0,
    myanmarBytes: 0,
  };
  if (!("caches" in window)) return status;
  try {
    const data = await manifest();
    const cache = await caches.open(`${prefix}ocr-${data.version}`);
    status.eng = await hasAssets(cache, requiredAssets(data, "eng"));
    status.mya = await hasAssets(cache, requiredAssets(data, "mya"));
    status.englishBytes = requiredAssets(data, "eng").reduce(
      (sum, a) => sum + a.bytes,
      0,
    );
    status.myanmarBytes =
      data.assets.find((a) => a.path === "ocr/lang/mya.traineddata")?.bytes ||
      0;
    if (navigator.serviceWorker?.controller) {
      const app = await appManifest();
      const shell = await caches.open(`${prefix}shell-${app.version}`);
      status.shell = await hasShell(shell, app);
    }
  } catch {
    /* Missing or evicted caches must never be reported ready. */
  }
  return status;
}
export function prepareLanguage(
  language: OCRLanguage,
  onProgress: (progress: number, status: string) => void = () => {},
) {
  const task = downloadLanguage(language, onProgress);
  downloadTask = task;
  const clear = () => {
    if (downloadTask === task) downloadTask = undefined;
  };
  void task.then(clear, clear);
  return task;
}
async function downloadLanguage(
  language: OCRLanguage,
  onProgress: (progress: number, status: string) => void,
) {
  if (!("caches" in window))
    throw new Error(
      "Offline preparation needs a secure HTTPS connection and browser cache storage.",
    );
  downloadController?.abort();
  const controller = new AbortController();
  downloadController = controller;
  try {
    const data = await manifest();
    await prepareShell(controller.signal, onProgress);
    const cache = await caches.open(`${prefix}ocr-${data.version}`);
    const assets = requiredAssets(data, language);
    const total = assets.reduce((n, a) => n + a.bytes, 0);
    let completed = 0;
    for (const asset of assets) {
      if (controller.signal.aborted)
        throw new DOMException("Download cancelled", "AbortError");
      if (await hasAssets(cache, [asset])) {
        completed += asset.bytes;
        continue;
      }
      const response = await fetch(assetURL(asset.path), {
        signal: controller.signal,
        cache: "no-store",
      });
      if (!response.ok || !response.body)
        throw new Error(
          "A language file could not be downloaded. Please retry.",
        );
      const reader = response.body.getReader();
      const chunks: Uint8Array<ArrayBuffer>[] = [];
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(new Uint8Array(value));
        received += value.byteLength;
        onProgress(
          Math.min((completed + received) / total, 0.99),
          "Downloading local OCR files",
        );
      }
      const blob = new Blob(chunks);
      const bytes = await blob.arrayBuffer();
      const digest = Array.from(
        new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
      )
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      if (bytes.byteLength !== asset.bytes || digest !== asset.sha256)
        throw new Error("An OCR download was incomplete. Please retry.");
      if (controller.signal.aborted)
        throw new DOMException("Download cancelled", "AbortError");
      await cache.put(
        assetURL(asset.path),
        new Response(bytes, {
          headers: {
            "content-type":
              response.headers.get("content-type") ||
              "application/octet-stream",
            "x-starry-sha256": digest,
          },
        }),
      );
      completed += asset.bytes;
      onProgress(completed / total, "Verifying offline files");
    }
    if (!(await hasAssets(cache, assets)))
      throw new Error(
        "Some OCR files were removed from browser storage. Please retry.",
      );
    onProgress(1, "Language files are available on this device");
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError")
      throw new Error(
        "There is not enough browser storage for OCR. Free some space or enter details manually.",
      );
    throw error;
  } finally {
    if (downloadController === controller) downloadController = undefined;
  }
}
export function cancelPreparation() {
  downloadController?.abort();
}
export async function removeMyanmar() {
  cancelPreparation();
  await downloadTask?.catch(() => {});
  if (!("caches" in window)) return;
  for (const name of await caches.keys()) {
    if (name.startsWith(`${prefix}ocr-`)) {
      const cache = await caches.open(name);
      await cache.delete(assetURL("ocr/lang/mya.traineddata"));
      await cache.delete(assetURL("ocr/lang/mya.traineddata.gz"));
    }
  }
}
export async function registerServiceWorker(onUpdate: () => void = () => {}) {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) return;
  registration = await navigator.serviceWorker.register(assetURL("sw.js"), {
    scope: import.meta.env.BASE_URL,
  });
  if (registration.waiting) onUpdate();
  registration.addEventListener("updatefound", () => {
    const worker = registration?.installing;
    worker?.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller)
        onUpdate();
    });
  });
}
/** Call only from a user action, after resolving unsaved edits. */
export function activateUpdate() {
  if (!registration?.waiting) return;
  navigator.serviceWorker.addEventListener(
    "controllerchange",
    () => location.reload(),
    { once: true },
  );
  registration.waiting.postMessage("ACTIVATE_UPDATE");
}
export async function deleteOfflineAssets() {
  cancelPreparation();
  await downloadTask?.catch(() => {});
  if (!("caches" in window)) return;
  for (const name of await caches.keys())
    if (name.startsWith(`${prefix}ocr-`)) await caches.delete(name);
}
