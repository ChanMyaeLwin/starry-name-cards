export async function processImage(file: File): Promise<string> {
  if (file.size > 20 * 1024 * 1024)
    throw new Error("Choose an image smaller than 20 MB.");
  if (!/^image\/(jpeg|png|webp|gif|bmp)$/.test(file.type))
    throw new Error(
      "Choose a JPEG, PNG, WebP, GIF, or BMP image. Convert HEIC to JPEG first.",
    );
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  }).catch(() => {
    throw new Error("This image could not be opened. Try a JPEG or PNG.");
  });
  try {
    if (bitmap.width * bitmap.height > 60_000_000)
      throw new Error(
        "This image is too large. Choose one under 60 megapixels.",
      );
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas
      .getContext("2d")!
      .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.9);
  } finally {
    bitmap.close();
  }
}
export async function transformImage(
  src: string,
  rotate: boolean,
  crop?: { x: number; y: number; w: number; h: number },
) {
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d")!;
  if (rotate) {
    c.width = img.height;
    c.height = img.width;
    ctx.translate(c.width, 0);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(img, 0, 0);
  } else if (crop) {
    c.width = (img.width * crop.w) / 100;
    c.height = (img.height * crop.h) / 100;
    ctx.drawImage(
      img,
      (img.width * crop.x) / 100,
      (img.height * crop.y) / 100,
      c.width,
      c.height,
      0,
      0,
      c.width,
      c.height,
    );
  }
  return c.toDataURL("image/jpeg", 0.9);
}
