import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const version = "0123456789abcdef";
const hash = "a".repeat(64);
const paths = [
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
const manifest = {
  version,
  assets: paths.map((path) => ({ path, bytes: 10, sha256: hash })),
};
let entries: Map<string, Map<string, Response>>;
let base: string;
function cache(name: string) {
  if (!entries.has(name)) entries.set(name, new Map());
  const values = entries.get(name)!;
  return {
    match: vi.fn(async (path: string) => values.get(path)?.clone()),
    delete: vi.fn(async (path: string) => values.delete(path)),
    put: vi.fn(async (path: string, response: Response) => {
      values.set(path, response);
    }),
  };
}
beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal("location", { href: "https://example.test/cards/" });
  base = new URL(import.meta.env.BASE_URL, "https://example.test/cards/").href;
  entries = new Map();
  const caches = {
    keys: vi.fn(async () => [...entries.keys()]),
    open: vi.fn(async (name: string) => cache(name)),
    delete: vi.fn(async (name: string) => entries.delete(name)),
  };
  vi.stubGlobal("caches", caches);
  vi.stubGlobal("window", { caches });
  vi.stubGlobal("navigator", {
    onLine: false,
    serviceWorker: { controller: null },
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json(manifest)),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("offline readiness and cache ownership", () => {
  it("does not equate being offline with being prepared", async () => {
    const { getOfflineStatus } = await import("./offline");
    expect(await getOfflineStatus()).toMatchObject({
      online: false,
      shell: false,
      eng: false,
      mya: false,
    });
  });
  it("requires every engine asset and language file and detects eviction", async () => {
    const name = `starry-${base}ocr-${version}`;
    const installed = cache(name);
    for (const path of paths)
      await installed.put(
        new URL(path, base).href,
        new Response("verified", { headers: { "x-starry-sha256": hash } }),
      );
    const { getOfflineStatus } = await import("./offline");
    expect(await getOfflineStatus()).toMatchObject({
      eng: true,
      mya: true,
      shell: false,
    });
    await installed.delete(new URL("ocr/lang/mya.traineddata", base).href);
    expect(await getOfflineStatus()).toMatchObject({ eng: true, mya: false });
    await installed.delete(new URL("ocr/worker.min.js", base).href);
    expect(await getOfflineStatus()).toMatchObject({ eng: false, mya: false });
  });
  it("rejects an empty manifest instead of declaring an empty pack installed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ version, assets: [] })),
    );
    const { getOfflineStatus, prepareLanguage } = await import("./offline");
    expect(await getOfflineStatus()).toMatchObject({ eng: false, mya: false });
    await expect(prepareLanguage("eng")).rejects.toThrow(
      "asset list is incomplete",
    );
  });
  it("does not delete another app’s caches or its own shell", async () => {
    const ours = `starry-${base}ocr-${version}`;
    const shell = `starry-${base}shell-${version}`;
    const unrelated =
      "starry-https://example.test/another-app/ocr-0123456789abcdef";
    cache(ours);
    cache(shell);
    cache(unrelated);
    const { deleteOfflineAssets } = await import("./offline");
    await deleteOfflineAssets();
    expect([...entries.keys()]).toEqual([shell, unrelated]);
  });
});

describe("app shell recovery", () => {
  it("restores an evicted shell while a service worker still controls the page", async () => {
    vi.stubGlobal("navigator", {
      onLine: true,
      serviceWorker: { controller: {} },
    });
    const app = {
      version,
      assets: ["index.html", "ocr/manifest.json", "assets/app.js"],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith("ocr/manifest.json")) return Response.json(manifest);
        if (url.endsWith("app-assets.json")) return Response.json(app);
        return new Response("app shell asset");
      }),
    );
    const installed = cache(`starry-${base}ocr-${version}`);
    for (const path of paths)
      await installed.put(
        new URL(path, base).href,
        new Response("verified", { headers: { "x-starry-sha256": hash } }),
      );
    const { getOfflineStatus, prepareLanguage } = await import("./offline");
    expect(await getOfflineStatus()).toMatchObject({ eng: true, shell: false });
    await prepareLanguage("eng");
    expect(await getOfflineStatus()).toMatchObject({ eng: true, shell: true });
    const shell = cache(`starry-${base}shell-${version}`);
    await shell.delete(new URL("assets/app.js", base).href);
    expect(await getOfflineStatus()).toMatchObject({ shell: false });
    await prepareLanguage("eng");
    expect(await getOfflineStatus()).toMatchObject({ shell: true });
  });
  it("rejects remote and traversing asset paths before caching them", async () => {
    vi.stubGlobal("navigator", {
      onLine: true,
      serviceWorker: { controller: {} },
    });
    const fetcher = vi.fn(async (url: string) =>
      url.endsWith("ocr/manifest.json")
        ? Response.json(manifest)
        : Response.json({
            version,
            assets: [
              "index.html",
              "ocr/manifest.json",
              "../another-app/file.js",
              "https://remote.test/file.js",
            ],
          }),
    );
    vi.stubGlobal("fetch", fetcher);
    const { prepareLanguage } = await import("./offline");
    await expect(prepareLanguage("eng")).rejects.toThrow(
      "app asset list is invalid",
    );
    expect(fetcher.mock.calls.every(([url]) => url.startsWith(base))).toBe(
      true,
    );
    expect([...entries.keys()].some((key) => key.includes("shell-"))).toBe(
      false,
    );
  });
});
