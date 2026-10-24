import { cp, readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const dist = new URL("../dist/", import.meta.url);
await cp(new URL("../LICENSE", import.meta.url), new URL("LICENSE", dist));
await cp(
  new URL("../THIRD_PARTY_NOTICES.md", import.meta.url),
  new URL("THIRD_PARTY_NOTICES.md", dist),
);
await cp(
  new URL("../docs/third-party/", import.meta.url),
  new URL("docs/third-party/", dist),
  { recursive: true },
);
async function walk(path = "") {
  const out = [];
  for (const entry of await readdir(new URL(path, dist), {
    withFileTypes: true,
  })) {
    const name = path + entry.name;
    if (entry.isDirectory()) out.push(...(await walk(name + "/")));
    else if (
      !name.startsWith("ocr/") &&
      !["sw.js", "app-assets.json"].includes(name)
    )
      out.push(name);
  }
  return out;
}
const assets = [...(await walk()), "ocr/manifest.json"];
const hash = createHash("sha256");
for (const path of assets) hash.update(await readFile(new URL(path, dist)));
const version = hash.digest("hex").slice(0, 16);
const ocr = JSON.parse(
  await readFile(new URL("ocr/manifest.json", dist), "utf8"),
);
await writeFile(
  new URL("app-assets.json", dist),
  JSON.stringify({ version, assets }),
);
await writeFile(
  new URL("sw.js", dist),
  `
const BASE = new URL('./', self.location).href;
const PREFIX = 'starry-' + BASE;
const SHELL = PREFIX + 'shell-${version}';
const OCR = PREFIX + 'ocr-${ocr.version}';
const ASSETS = ${JSON.stringify([...assets, "app-assets.json", "./"])};
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(SHELL);
  await cache.addAll(ASSETS.map(path => new URL(path, BASE).href));
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  // Activation occurs only after the user accepts an update or all old tabs close.
  for (const key of await caches.keys()) if (key.startsWith(PREFIX + 'shell-') && key !== SHELL) await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('message', event => {
  if (event.data === 'ACTIVATE_UPDATE') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(BASE)) return;
  event.respondWith((async () => {
    const shell = await caches.open(SHELL);
    const exact = await shell.match(request, { ignoreVary: true });
    if (exact) return exact;
    if (request.url.startsWith(BASE + 'ocr/')) {
      const cached = await (await caches.open(OCR)).match(request);
      if (cached) return cached;
    }
    try { return await fetch(request); }
    catch (error) {
      if (request.mode === 'navigate') return (await shell.match(new URL('./', BASE).href)) || Response.error();
      throw error;
    }
  })());
});
`,
);
console.log(`Service worker built: ${assets.length} shell assets, ${version}.`);
