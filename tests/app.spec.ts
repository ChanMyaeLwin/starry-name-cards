import { test, expect, type Page } from "@playwright/test";
async function manual(page: Page, name = "Alex Example") {
  await page
    .getByRole("button", { name: "Scan a Name Card", exact: false })
    .first()
    .click();
  await page.getByRole("button", { name: "Enter Details Manually" }).click();
  await page.getByLabel("Full name", { exact: true }).fill(name);
  await page.getByLabel("Company", { exact: true }).fill("Example Studio");
}
test("manual contact persists, edits, exports, backs up, restores and deletes", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "My Name Cards" }).click();
  await expect(
    page.getByText("Your next connection starts here."),
  ).toBeVisible();
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await manual(page);
  await page.getByRole("button", { name: "Save to My Name Cards" }).click();
  await expect(page.getByText("Alex Example", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /^AL Alex Example/ }).click();
  await page.getByLabel("Full name", { exact: true }).fill("Alex Updated");
  await page.getByText("Contact QR code", { exact: true }).click();
  await page.getByRole("button", { name: "Generate QR" }).click();
  await expect(
    page.getByRole("img", { name: "Contact QR code" }),
  ).toBeVisible();
  const downloaded = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download Contact (.vcf)", exact: true })
    .click();
  expect((await downloaded).suggestedFilename()).toBe("Alex Updated.vcf");
  await page.getByRole("button", { name: "Save to My Name Cards" }).click();
  page.on("dialog", (d) => d.accept());
  const backupEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON backup" }).click();
  const backup = await backupEvent;
  const path = await backup.path();
  await page.getByRole("button", { name: "Delete Alex Updated" }).click();
  await expect(
    page.getByText("Your next connection starts here."),
  ).toBeVisible();
  await page.locator("input[type=file]").setInputFiles(path!);
  await page
    .getByRole("button", { name: "Restore cards", exact: true })
    .click();
  await expect(page.getByText("Alex Updated", { exact: true })).toBeVisible();
});
test("download/share does not save and unsafe text remains text", async ({
  page,
}) => {
  await page.goto("/");
  await manual(page, "<img src=x onerror=alert(1)>");
  await page.evaluate(() =>
    Object.defineProperty(navigator, "canShare", {
      value: () => false,
      configurable: true,
    }),
  );
  const dl = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Share Contact", exact: true })
    .click();
  await dl;
  await expect(page.getByText("File sharing is unavailable.")).toBeVisible();
  page.on("dialog", (d) => d.accept());
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await page.getByRole("link", { name: "Connections", exact: true }).click();
  await expect(
    page.getByText("Your next connection starts here."),
  ).toBeVisible();
});
test("real local OCR offline and missing pack fallback", async ({
  page,
  context,
}) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (
      !r.url().startsWith("http://127.0.0.1:4173") &&
      !r.url().startsWith("data:") &&
      !r.url().startsWith("blob:")
    )
      external.push(r.url());
  });
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page
    .getByRole("button", { name: "Scan a Name Card", exact: false })
    .first()
    .click();
  const initialPhoto = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 300;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 1000, 300);
    ctx.fillStyle = "black";
    ctx.font = "48px Arial";
    ctx.fillText("alex@example.com", 50, 150);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "synthetic.png",
      mimeType: "image/png",
      buffer: Buffer.from(initialPhoto, "base64"),
    });
  await page.getByRole("button", { name: "Read Card", exact: true }).click();
  const downloadDialog = page.getByRole("dialog", {
    name: "Download OCR to read this card",
  });
  await expect(downloadDialog).toBeVisible();
  await downloadDialog.getByRole("button", { name: "Not now" }).click();
  await expect(page.getByAltText("Front of business card")).toBeVisible();
  await page.getByRole("button", { name: "Read Card", exact: true }).click();
  await downloadDialog
    .getByRole("button", { name: "Download and read" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Check the details" }),
  ).toBeVisible({ timeout: 60000 });
  await expect(page.getByLabel("emails 1", { exact: true })).toHaveValue(
    "alex@example.com",
  );
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(
    page.getByText("Myanmar: installed", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Recognition language", exact: true }),
  ).toHaveCount(0);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Settings", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /Your next connection/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Scan a Name Card", exact: false })
    .first()
    .click();
  const bytes = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 1200;
    c.height = 600;
    const x = c.getContext("2d")!;
    x.fillStyle = "white";
    x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = "black";
    x.font = "48px Arial";
    x.fillText("Name: Alex Example", 70, 130);
    x.fillText("alex@example.com", 70, 240);
    x.fillText("+1 202 555 0142", 70, 350);
    return c.toDataURL("image/png").split(",")[1];
  });
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "synthetic.png",
      mimeType: "image/png",
      buffer: Buffer.from(bytes, "base64"),
    });
  await page.getByRole("button", { name: "Read Card", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Check the details" }),
  ).toBeVisible({ timeout: 60000 });
  await expect(page.getByLabel("emails 1", { exact: true })).toHaveValue(
    "alex@example.com",
  );
  await page.getByLabel("Full name", { exact: true }).fill("Alex Example");
  await page.getByRole("button", { name: "Save to My Name Cards" }).click();
  await page.getByRole("button", { name: "Scan a card", exact: true }).click();
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "synthetic.png",
      mimeType: "image/png",
      buffer: Buffer.from(bytes, "base64"),
    });
  // Both packs were installed together; simulate browser eviction of Myanmar.
  await page.evaluate(async () => {
    const names = await caches.keys();
    for (const name of names) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) {
        if (request.url.endsWith("/lang/mya.traineddata"))
          await cache.delete(request);
      }
    }
  });
  await page.getByLabel("OCR recognition language").selectOption("mya");
  await page.getByRole("button", { name: "Read Card", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Download OCR to read this card" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Download and read" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Not now", exact: true }).click();
  await page.getByLabel("OCR recognition language").selectOption("eng");
  await page.getByRole("button", { name: "Read Card", exact: true }).click();
  await page.getByRole("button", { name: "Cancel reading" }).click();
  await expect(
    page.getByRole("button", { name: "Read Card", exact: true }),
  ).toBeVisible();
  expect(external).toEqual([]);
});
test("mobile home fits viewport and has two primary actions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Scan a Name Card", exact: false }),
  ).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.reload();
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
});
test("an available service worker update preserves unsaved edits", async ({
  page,
}) => {
  const { readFile, writeFile } = await import("node:fs/promises");
  const original = await readFile("dist/sw.js", "utf8");
  try {
    await page.goto("/");
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await manual(page, "Unsaved Example");
    await writeFile(
      "dist/sw.js",
      original + "\n// Integration update " + Date.now(),
    );
    await page.evaluate(async () => {
      const r = await navigator.serviceWorker.getRegistration();
      await r?.update();
    });
    await expect(
      page.getByText("Update available. Save your work before updating."),
    ).toBeVisible({ timeout: 30000 });
    await expect(page.getByLabel("Full name", { exact: true })).toHaveValue(
      "Unsaved Example",
    );
  } finally {
    await writeFile("dist/sw.js", original);
  }
});
test("duplicate email requires an explicit choice", async ({ page }) => {
  await page.goto("/");
  await manual(page, "First Example");
  await page.getByRole("button", { name: "Add email" }).click();
  await page.getByLabel("emails 1", { exact: true }).fill("shared@example.com");
  await page.getByRole("button", { name: "Save to My Name Cards" }).click();
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await manual(page, "Second Example");
  await page.getByRole("button", { name: "Add email" }).click();
  await page.getByLabel("emails 1", { exact: true }).fill("SHARED@example.com");
  await page.getByRole("button", { name: "Save to My Name Cards" }).click();
  await expect(
    page.getByRole("dialog", { name: "A familiar connection?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save separately" }).click();
  await expect(page.getByText("Second Example", { exact: true })).toBeVisible();
  await expect(page.getByText("First Example", { exact: true })).toBeVisible();
});
test("app navigation has distinct URLs, history, local profile and reloadable connections", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await nav.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(page).toHaveURL(/#\/settings$/);
  await expect(nav.getByRole("link", { name: "Settings" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Settings", exact: true }),
  ).toBeVisible();
  await nav.getByRole("link", { name: "More", exact: true }).click();
  await expect(page).toHaveURL(/#\/more$/);
  await page.getByRole("link", { name: /Profile Your details/ }).click();
  await expect(page).toHaveURL(/#\/profile$/);
  await page.getByLabel("Display name").fill("Local Example");
  await page.getByLabel("About you").fill("Community volunteer");
  await page.getByRole("button", { name: "Save profile" }).click();
  await page.reload();
  await expect(page.getByLabel("Display name")).toHaveValue("Local Example");
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "More", exact: true }),
  ).toBeVisible();
  await page.goForward();
  await expect(
    page.getByRole("heading", { name: "Your profile" }),
  ).toBeVisible();
  await nav.getByRole("link", { name: "Home", exact: true }).click();
  await manual(page, "Routing Example");
  await page.getByRole("button", { name: "Save to My Name Cards" }).click();
  await expect(page).toHaveURL(/#\/connections$/);
  await page.getByRole("button", { name: /^RO Routing Example/ }).click();
  await expect(page).toHaveURL(/#\/connections\/[a-z0-9-]+$/);
  page.on("dialog", (d) => d.accept());
  await page.reload();
  await expect(page.getByLabel("Full name", { exact: true })).toHaveValue(
    "Routing Example",
  );
  await nav.getByRole("link", { name: "More" }).click();
  await page.getByRole("link", { name: /Privacy Your data/ }).click();
  await expect(page).toHaveURL(/#\/privacy$/);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Your connections. Your privacy." }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/privacy-mobile.png",
    fullPage: true,
  });
  await nav.getByRole("link", { name: "Settings" }).click();
  await page.screenshot({
    path: "test-results/settings-mobile.png",
    fullPage: true,
  });
  await nav.getByRole("link", { name: "More" }).click();
  await page.screenshot({
    path: "test-results/more-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("install prompt is captured before More opens and used only after a click", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(event, {
      prompt: async () => {
        document.documentElement.dataset.installCalls = String(
          Number(document.documentElement.dataset.installCalls || 0) + 1,
        );
        return { outcome: "dismissed" };
      },
      userChoice: Promise.resolve({ outcome: "dismissed" }),
    });
    window.dispatchEvent(event);
  });
  await page.getByRole("link", { name: "More", exact: true }).click();
  expect(
    await page.locator("html").getAttribute("data-install-calls"),
  ).toBeNull();
  await page
    .getByRole("button", { name: "Add to home screen", exact: true })
    .click();
  await expect(
    page.getByText(
      "Installation cancelled. You can try again from your browser menu.",
    ),
  ).toBeVisible();
  expect(await page.locator("html").getAttribute("data-install-calls")).toBe(
    "1",
  );
  await page
    .getByRole("button", { name: "Add to home screen", exact: true })
    .click();
  expect(await page.locator("html").getAttribute("data-install-calls")).toBe(
    "1",
  );
  await expect(
    page.getByRole("heading", { name: "On your computer" }),
  ).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await expect(
    page.getByText("STARRY is installed on this device."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add to home screen", exact: true }),
  ).toHaveCount(0);
});
test("iPhone install fallback shows Safari directions", async ({ browser }) => {
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
  });
  const page = await context.newPage();
  await page.addInitScript(() =>
    window.addEventListener("beforeinstallprompt", (event) =>
      event.stopImmediatePropagation(),
    ),
  );
  await page.goto("http://127.0.0.1:4173/#/more");
  await page
    .getByRole("button", { name: "Add to home screen", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "On iPhone or iPad" }),
  ).toBeVisible();
  await expect(page.getByText("Open this address in Safari.")).toBeVisible();
  await expect(
    page.getByText(
      "Choose Add to Home Screen, turn on Open as Web App if shown, then tap Add.",
    ),
  ).toBeVisible();
  await context.close();
});
