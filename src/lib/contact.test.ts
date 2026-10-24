import { describe, expect, it } from "vitest";
import {
  contactFilename,
  createBackup,
  emptyContact,
  escapeVCard,
  exportVCards,
  findDuplicates,
  foldVCardLine,
  normalizePhone,
  parseBackup,
  parseContactText,
  safeWebsite,
  toVCard,
  validateContact,
  validatePhotoDataUrl,
} from "./contact";

const tinyPng =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNgYGAAAAAEAAH2FzhVAAAAAElFTkSuQmCC";

const tinyJpeg =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==";
const tinyWebp =
  "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAUAmJaQAA3AA/vz0AAA=";

const example = () => ({
  ...emptyContact(),
  name: "မေ သက်",
  company: "Example Studio",
  phones: [{ label: "mobile", value: "+95 09 123 4567 ext. 02" }],
  emails: [{ label: "work", value: "hello@example.com" }],
});

describe("transparent text parsing", () => {
  it("extracts multiple explicit values without inventing identities or splitting Myanmar names", () => {
    const contact = parseContactText(
      "မေ သက်\nExample Studio\nDesigner\nPhone: +95 09 123 4567 ext. 02\nhello@example.com\nTEAM@example.com\nhttps://example.com\nName: မေ သက်",
    );
    expect(contact.name).toBe("မေ သက်");
    expect(contact.givenName).toBe("");
    expect(contact.company).toBe("");
    expect(contact.title).toBe("");
    expect(contact.notes).toContain("Designer");
    expect(contact.phones[0].value).toBe("+95 09 123 4567 ext. 02");
    expect(contact.emails).toHaveLength(2);
    expect(contact.websites).toEqual(["https://example.com"]);
    expect(contact.rawText).toContain("Example Studio");
  });
  it("requires at least one identifying field", () => {
    expect(validateContact(emptyContact())).toHaveLength(1);
    expect(validateContact({ ...emptyContact(), company: "Example" })).toEqual(
      [],
    );
  });
});

describe("duplicate matching", () => {
  it("preserves country ambiguity, leading zeros and extensions", () => {
    expect(normalizePhone("+95 (09) 123-4567 ext. 02")).toBe("+95091234567x02");
    expect(normalizePhone("09 123-4567")).toBe("091234567");
    expect(normalizePhone("0095 09 1234567")).not.toBe(
      normalizePhone("+95 09 1234567"),
    );
    expect(normalizePhone("091234567 x1")).not.toBe(
      normalizePhone("091234567 x2"),
    );
  });
  it("matches case-insensitive email and punctuation-only phone changes; excludes self", () => {
    const saved = example();
    const candidate = {
      ...emptyContact(),
      emails: [{ label: "other", value: " HELLO@EXAMPLE.COM " }],
    };
    expect(findDuplicates(candidate, [saved])).toEqual([saved]);
    expect(findDuplicates(saved, [saved])).toEqual([]);
    expect(
      findDuplicates(
        {
          ...emptyContact(),
          phones: [{ label: "home", value: "+95091234567 x02" }],
        },
        [saved],
      ),
    ).toEqual([saved]);
  });
});

describe("vCard 3.0", () => {
  it("escapes injection delimiters and uses CRLF", () => {
    expect(escapeVCard("a,b;c\\d\r\nEND:VCARD")).toBe(
      "a\\,b\\;c\\\\d\\nEND:VCARD",
    );
    const card = toVCard({
      ...example(),
      notes: "one\ntwo,three;four\\five",
      address: "၁၂ လမ်း\nYangon",
      givenName: "Given",
      familyName: "Family",
    });
    expect(card).toContain("VERSION:3.0\r\n");
    expect(card).toContain("N:Family;Given;;;\r\n");
    expect(card).toContain("FN:မေ သက်\r\n");
    expect(card).toContain("NOTE:one\\ntwo\\,three\\;four\\\\five\r\n");
    expect(card).not.toContain("PHOTO");
    expect(card.replace(/\r\n/g, "")).not.toContain("\n");
  });
  it("folds without splitting Unicode and counts continuation spaces", () => {
    const original = `NOTE:${"မြန်မာ😀".repeat(40)}`;
    const folded = foldVCardLine(original);
    expect(
      folded
        .split("\r\n")
        .every((line) => new TextEncoder().encode(line).length <= 75),
    ).toBe(true);
    expect(folded.replace(/\r\n /g, "")).toBe(original);
    expect(folded).not.toContain("\uFFFD");
  });
  it("exports independent records, preserves unsplit full names and safe filenames", () => {
    const data = exportVCards([example(), { ...example(), name: "Other" }]);
    expect(data.match(/BEGIN:VCARD/g)).toHaveLength(2);
    expect(data).toContain("N:;;;;\r\n");
    expect(contactFilename({ ...example(), name: "../မေ/သက်:*?" })).toBe(
      "မေသက်.vcf",
    );
    expect(
      toVCard({ ...example(), websites: ["https://example.com/a;b?q=x,y"] }),
    ).toContain("URL:https://example.com/a;b?q=x,y\r\n");
  });
});

describe("backup validation and restore", () => {
  it("round-trips exact Unicode contact data and excludes retained photos by default", () => {
    const contact = { ...example(), photos: [tinyPng] };
    expect(parseBackup(createBackup([contact]))).toEqual([
      { ...contact, photos: [] },
    ]);
    expect(parseBackup(createBackup([contact], true))).toEqual([contact]);
  });
  it("checks decoded photo signatures, dimensions, truncation and corrupted PNG bytes", () => {
    expect(validatePhotoDataUrl(tinyPng)).toBe(true);
    expect(validatePhotoDataUrl(tinyJpeg)).toBe(true);
    expect(validatePhotoDataUrl(tinyWebp)).toBe(true);
    expect(validatePhotoDataUrl(tinyJpeg.slice(0, -4))).toBe(false);
    expect(validatePhotoDataUrl(tinyWebp.slice(0, -4))).toBe(false);
    expect(validatePhotoDataUrl("data:image/png;base64,YWJj")).toBe(false);
    expect(
      validatePhotoDataUrl(tinyPng.replace("image/png", "image/jpeg")),
    ).toBe(false);
    expect(validatePhotoDataUrl(tinyPng.slice(0, -4))).toBe(false);
    const bytes = Uint8Array.from(atob(tinyPng.split(",")[1]), (c) =>
      c.charCodeAt(0),
    );
    bytes[45] ^= 1;
    expect(
      validatePhotoDataUrl(
        `data:image/png;base64,${btoa(String.fromCharCode(...bytes))}`,
      ),
    ).toBe(false);
    bytes[45] ^= 1;
    new DataView(bytes.buffer).setUint32(16, 99999);
    expect(
      validatePhotoDataUrl(
        `data:image/png;base64,${btoa(String.fromCharCode(...bytes))}`,
      ),
    ).toBe(false);
    const json = JSON.parse(createBackup([example()]));
    json.contacts[0].photos = ["data:image/png;base64,YWJj"];
    expect(() => parseBackup(JSON.stringify(json))).toThrow("photos");
  });
  it("rejects future schemas, duplicate IDs, invalid timestamps and executable image formats", () => {
    const json = JSON.parse(createBackup([example()]));
    expect(() =>
      parseBackup(JSON.stringify({ ...json, schemaVersion: 2 })),
    ).toThrow("version");
    expect(() =>
      parseBackup(
        JSON.stringify({
          ...json,
          contacts: [...json.contacts, ...json.contacts],
        }),
      ),
    ).toThrow("IDs");
    json.contacts[0].createdAt = "yesterday";
    expect(() => parseBackup(JSON.stringify(json))).toThrow("timestamps");
    json.contacts[0] = {
      ...example(),
      photos: ["data:image/svg+xml;base64,YWJj"],
    };
    expect(() => parseBackup(JSON.stringify(json))).toThrow("photos");
  });
  it("treats imported markup as inert text and strips unknown properties", () => {
    const json = JSON.parse(
      createBackup([{ ...example(), notes: "<script>alert(1)</script>" }]),
    );
    json.contacts[0].unexpected = "discard me";
    const restored = parseBackup(JSON.stringify(json))[0];
    expect(restored.notes).toBe("<script>alert(1)</script>");
    expect(restored).not.toHaveProperty("unexpected");
    expect(safeWebsite("javascript:alert(1)")).toBeNull();
    expect(safeWebsite("data:text/html,hello")).toBeNull();
    expect(safeWebsite("https://user:password@example.com")).toBeNull();
    expect(safeWebsite("example.com")).toBe("https://example.com/");
  });
});
