import {
  mkdir,
  readdir,
  readFile,
  writeFile,
  copyFile,
  stat,
  rm,
} from "node:fs/promises";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
const root = new URL("../", import.meta.url);
const dir = new URL("public/ocr/", root);
await mkdir(new URL("core/", dir), { recursive: true });
await mkdir(new URL("lang/", dir), { recursive: true });
await copyFile(
  new URL("node_modules/tesseract.js/dist/worker.min.js", root),
  new URL("worker.min.js", dir),
);
const core = new URL("node_modules/tesseract.js-core/", root);
for (const file of await readdir(core)) {
  if (/\.wasm(?:\.js)?$/.test(file))
    await copyFile(new URL(file, core), new URL(`core/${file}`, dir));
}
const revision = "87416418657359cb625c412a48b6e1d6d41c29bd";
const modelHashes = {
  eng: "7d4322bd2a7749724879683fc3912cb542f19906c83bcc1a52132556427170b2",
  mya: "02aa6c25cfe9e583fa7b5d4131eac948f962308983f0f397df077dea58212b03",
};
const digest = (data) => createHash("sha256").update(data).digest("hex");
for (const lang of ["eng", "mya"]) {
  const destination = new URL(`lang/${lang}.traineddata`, dir);
  const obsolete = new URL(`lang/${lang}.traineddata.gz`, dir);
  // Migrate already-downloaded packs without needing another network request.
  try {
    const prior = gunzipSync(await readFile(obsolete));
    if (digest(prior) === modelHashes[lang])
      await writeFile(destination, prior);
  } catch {
    /* No legacy pack, or an incomplete previous download. */
  }
  await rm(obsolete, { force: true });
  try {
    if (digest(await readFile(destination)) === modelHashes[lang]) continue;
  } catch {
    /* First setup or interrupted prior write. */
  }
  console.log(
    `Downloading ${lang} OCR model from pinned tessdata_fast revision…`,
  );
  const response = await fetch(
    `https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/${revision}/${lang}.traineddata`,
  );
  if (!response.ok)
    throw new Error(`Could not download ${lang}: ${response.status}`);
  const data = Buffer.from(await response.arrayBuffer());
  if (digest(data) !== modelHashes[lang])
    throw new Error(`Integrity check failed for ${lang} model`);
  await writeFile(destination, data);
}
try {
  await stat(new URL("TESSDATA-LICENSE", dir));
} catch {
  const licenseResponse = await fetch(
    `https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/${revision}/LICENSE`,
  );
  if (!licenseResponse.ok) throw new Error("Unable to retrieve model license");
  await writeFile(
    new URL("TESSDATA-LICENSE", dir),
    await licenseResponse.text(),
  );
}
await copyFile(
  new URL("node_modules/tesseract.js/LICENSE.md", root),
  new URL("TESSERACT-LICENSE.md", dir),
);
await copyFile(new URL("LICENSE", core), new URL("CORE-LICENSE", dir));
const files = [
  "worker.min.js",
  ...(await readdir(new URL("core/", dir))).map((f) => `core/${f}`),
  "lang/eng.traineddata",
  "lang/mya.traineddata",
];
const assets = [];
for (const path of files) {
  const data = await readFile(new URL(path, dir));
  assets.push({
    path: `ocr/${path}`,
    bytes: data.length,
    sha256: createHash("sha256").update(data).digest("hex"),
  });
}
const version = createHash("sha256")
  .update(JSON.stringify(assets))
  .digest("hex")
  .slice(0, 16);
await writeFile(
  new URL("manifest.json", dir),
  JSON.stringify({ version, modelRevision: revision, assets }, null, 2),
);
console.log(
  `Local OCR assets ready (${Math.round(assets.reduce((n, a) => n + a.bytes, 0) / 1048576)} MB).`,
);
