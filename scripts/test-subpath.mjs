import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
const env = { ...process.env, VITE_BASE_PATH: "/name-cards/" };
const build = () => {
  const r = spawnSync("npm", ["run", "build"], { env, stdio: "inherit" });
  if (r.status) throw new Error("Subpath build failed");
};
build();
const server = spawn("npm", ["run", "preview", "--", "--port", "4174"], {
  env,
  stdio: "pipe",
});
let browser;
try {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      if ((await fetch("http://127.0.0.1:4174/name-cards/")).ok) break;
    } catch {}
    await delay(250);
  }
  browser = await chromium.launch({ channel: "chromium" });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:4174/name-cards/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page
    .getByRole("button", { name: "Download / verify offline assets" })
    .click();
  await page
    .getByText("Selected OCR assets installed.", { exact: false })
    .waitFor({ timeout: 60000 });
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("heading", { name: /Your next connection/ }).waitFor();
  await page.getByRole("button", { name: /Scan a Name Card/ }).click();
  await page.getByRole("button", { name: "Enter Details Manually" }).click();
  await page.getByLabel("Full name", { exact: true }).fill("Subpath Example");
  await page.getByRole("button", { name: "Save to My Name Cards" }).click();
  await page.getByText("Subpath Example", { exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log("Subpath offline launch, assets, and local save passed.");
} finally {
  await browser?.close();
  server.kill("SIGTERM");
  const r = spawnSync("npm", ["run", "build"], {
    env: { ...process.env, VITE_BASE_PATH: "./" },
    stdio: "inherit",
  });
  if (r.status) process.exitCode = 1;
}
