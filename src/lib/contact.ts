import { localId } from "./id";
/** All contact values are untrusted plain text. No country or name-order assumptions. */
export interface ContactValue {
  label: string;
  value: string;
}
export interface Contact {
  id: string;
  name: string;
  givenName: string;
  familyName: string;
  company: string;
  title: string;
  phones: ContactValue[];
  emails: ContactValue[];
  websites: string[];
  address: string;
  notes: string;
  rawText: string;
  photos: string[];
  createdAt: string;
  updatedAt: string;
  schemaVersion: 1;
}
export function emptyContact(): Contact {
  const now = new Date().toISOString();
  return {
    id: localId(),
    name: "",
    givenName: "",
    familyName: "",
    company: "",
    title: "",
    phones: [],
    emails: [],
    websites: [],
    address: "",
    notes: "",
    rawText: "",
    photos: [],
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
  };
}
export function validateContact(contact: Contact): string[] {
  return [
    contact.name,
    contact.company,
    ...contact.phones.map((p) => p.value),
    ...contact.emails.map((e) => e.value),
  ].some((value) => value.trim())
    ? []
    : [
        "Add a name, company, phone number, or email before saving or exporting.",
      ];
}
export const normalizeEmail = (value: string): string =>
  value.trim().toLowerCase();
/** Keep local, international and extension numbers distinct; never infer a country code. */
export function normalizePhone(value: string): string {
  const trimmed = value.trim();
  const extension = trimmed.match(/(?:ext\.?|extension|x|#)\s*(\d+)\s*$/i);
  const main = extension ? trimmed.slice(0, extension.index) : trimmed;
  const digits = main.replace(/\D/g, "");
  return digits
    ? (main.startsWith("+") ? "+" : "") +
        digits +
        (extension ? `x${extension[1]}` : "")
    : "";
}
export function findDuplicates(
  contact: Contact,
  collection: Contact[],
): Contact[] {
  const emails = new Set(
    contact.emails.map((e) => normalizeEmail(e.value)).filter(Boolean),
  );
  const phones = new Set(
    contact.phones.map((p) => normalizePhone(p.value)).filter(Boolean),
  );
  return collection.filter(
    (other) =>
      other.id !== contact.id &&
      (other.emails.some((e) => emails.has(normalizeEmail(e.value))) ||
        other.phones.some((p) => phones.has(normalizePhone(p.value)))),
  );
}
export function safeWebsite(value: string): string | null {
  try {
    const trimmed = value.trim();
    if (!trimmed || /[\s\u0000-\u001f]/.test(trimmed)) return null;
    const url = new URL(
      /^[a-z][\w+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`,
    );
    return ["https:", "http:"].includes(url.protocol) &&
      url.hostname.includes(".") &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
/** Only explicit labels assign identity fields. Unassigned text remains visible in notes and rawText. */
export function parseContactText(rawText: string): Contact {
  const contact = emptyContact();
  contact.rawText = rawText;
  const remainder: string[] = [];
  for (const source of rawText.split(/\r?\n/)) {
    let line = source.trim();
    if (!line) continue;
    const explicit = line.match(
      /^(name|company|organization|title|address)\s*:\s*(.+)$/i,
    );
    if (explicit) {
      const fields = {
        name: "name",
        company: "company",
        organization: "company",
        title: "title",
        address: "address",
      } as const;
      const field = fields[explicit[1].toLowerCase() as keyof typeof fields];
      contact[field] = contact[field]
        ? `${contact[field]}\n${explicit[2]}`
        : explicit[2];
      continue;
    }
    line = line.replace(
      /[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9.-]*[A-Z0-9])?\.[A-Z]{2,}/gi,
      (match) => {
        if (
          !contact.emails.some(
            (e) => normalizeEmail(e.value) === normalizeEmail(match),
          )
        )
          contact.emails.push({ label: "work", value: match });
        return "";
      },
    );
    line = line.replace(/(?:https?:\/\/|www\.)[^\s<>]+/gi, (match) => {
      const cleaned = match.replace(/[.,;)]*$/, "");
      if (safeWebsite(cleaned) && !contact.websites.includes(cleaned))
        contact.websites.push(cleaned);
      return "";
    });
    line = line.replace(
      /\+?\d[\d\s().-]{5,}\d(?:\s*(?:ext\.?|extension|x|#)\s*\d+)?/gi,
      (match) => {
        if (match.replace(/\D/g, "").length < 7) return match;
        const value = match.trim();
        if (
          !contact.phones.some(
            (p) => normalizePhone(p.value) === normalizePhone(value),
          )
        )
          contact.phones.push({ label: "work", value });
        return "";
      },
    );
    line = line
      .replace(
        /\b(?:tel|telephone|phone|mobile|email|e-mail|web|website|fax)\s*:?/gi,
        "",
      )
      .replace(/^[\s:|;,]+|[\s:|;,]+$/g, "");
    if (line) remainder.push(line);
  }
  contact.notes = remainder.join("\n");
  return contact;
}
export function escapeVCard(value: string): string {
  return value
    .replace(/\u0000/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}
/** RFC 2425: physical lines at most 75 UTF-8 octets; continuation starts with a space. */
export function foldVCardLine(line: string): string {
  const encoder = new TextEncoder();
  let result = "";
  let size = 0;
  for (const character of line) {
    const bytes = encoder.encode(character).length;
    if (size + bytes > 75) {
      result += "\r\n ";
      size = 1;
    }
    result += character;
    size += bytes;
  }
  return result;
}
function vcardType(label: string, kind: "phone" | "email"): string {
  const known: Record<string, string> = {
    work: "WORK",
    home: "HOME",
    mobile: "CELL",
    cell: "CELL",
    fax: "FAX",
    other: "VOICE",
  };
  return kind === "email"
    ? label.toLowerCase() === "home"
      ? "HOME,INTERNET"
      : "WORK,INTERNET"
    : known[label.toLowerCase()] || "VOICE";
}
export function toVCard(contact: Contact): string {
  const errors = validateContact(contact);
  if (errors.length) throw new Error(errors[0]);
  const e = escapeVCard;
  const fullName =
    contact.name.trim() ||
    contact.company.trim() ||
    contact.emails.find((v) => v.value.trim())?.value ||
    contact.phones.find((v) => v.value.trim())?.value ||
    "";
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${e(fullName)}`,
    `N:${e(contact.familyName)};${e(contact.givenName)};;;`,
  ];
  if (contact.company) lines.push(`ORG:${e(contact.company)}`);
  if (contact.title) lines.push(`TITLE:${e(contact.title)}`);
  for (const phone of contact.phones)
    if (phone.value.trim())
      lines.push(
        `TEL;TYPE=${vcardType(phone.label, "phone")}:${e(phone.value)}`,
      );
  for (const email of contact.emails)
    if (email.value.trim())
      lines.push(
        `EMAIL;TYPE=${vcardType(email.label, "email")}:${e(email.value)}`,
      );
  for (const website of contact.websites) {
    const url = safeWebsite(website);
    // URL is a URI value, not a TEXT property: preserve URI delimiters verbatim.
    if (url) lines.push(`URL:${url}`);
  }
  if (contact.address) lines.push(`ADR;TYPE=WORK:;;${e(contact.address)};;;;`);
  if (contact.notes) lines.push(`NOTE:${e(contact.notes)}`);
  lines.push("END:VCARD");
  return lines.map(foldVCardLine).join("\r\n") + "\r\n";
}
export const exportVCards = (contacts: Contact[]): string =>
  contacts.map(toVCard).join("");
export function contactFilename(contact: Contact): string {
  const name = (contact.name || contact.company || "contact")
    .normalize("NFC")
    .replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, "")
    .replace(/^\.+|[. ]+$/g, "")
    .trim();
  return `${Array.from(name || "contact")
    .slice(0, 80)
    .join("")}.vcf`;
}
export const MAX_BACKUP_BYTES = 25 * 1024 * 1024;
/** Check raster containers and bounded dimensions before images reach the browser decoder.
 * This is structural validation, not a replacement for the browser's image decoder.
 */
export function validatePhotoDataUrl(value: string): boolean {
  if (value.length > 12 * 1024 * 1024) return false;
  const match = value.match(
    /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/,
  );
  if (!match || match[2].length % 4 !== 0) return false;
  try {
    const binary = atob(match[2]);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const view = new DataView(bytes.buffer);
    const ascii = (offset: number, length: number) =>
      String.fromCharCode(...bytes.slice(offset, offset + length));
    const dimensions = (width: number, height: number) =>
      width > 0 &&
      height > 0 &&
      width <= 4096 &&
      height <= 4096 &&
      width * height <= 16_000_000;
    if (match[1] === "png") {
      if (
        bytes.length < 45 ||
        ![137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b)
      )
        return false;
      if (
        view.getUint32(8) !== 13 ||
        ascii(12, 4) !== "IHDR" ||
        !dimensions(view.getUint32(16), view.getUint32(20))
      )
        return false;
      let offset = 8;
      let hasData = false;
      while (offset + 12 <= bytes.length) {
        const size = view.getUint32(offset);
        if (size > bytes.length - offset - 12) return false;
        const type = ascii(offset + 4, 4);
        let crc = 0xffffffff;
        for (let i = offset + 4; i < offset + 8 + size; i++) {
          crc ^= bytes[i];
          for (let bit = 0; bit < 8; bit++)
            crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
        }
        if ((crc ^ 0xffffffff) >>> 0 !== view.getUint32(offset + 8 + size))
          return false;
        offset += size + 12;
        if (type === "IDAT" && size > 0) hasData = true;
        if (type === "IEND")
          return size === 0 && offset === bytes.length && hasData;
      }
      return false;
    }
    if (match[1] === "jpeg") {
      if (
        bytes.length < 20 ||
        bytes[0] !== 0xff ||
        bytes[1] !== 0xd8 ||
        bytes.at(-2) !== 0xff ||
        bytes.at(-1) !== 0xd9
      )
        return false;
      let offset = 2;
      let validDimensions = false;
      while (offset + 4 <= bytes.length) {
        if (bytes[offset++] !== 0xff) return false;
        while (bytes[offset] === 0xff) offset++;
        const marker = bytes[offset++];
        if (marker === 0xda)
          return (
            validDimensions &&
            offset + view.getUint16(offset) < bytes.length - 2
          );
        const size = view.getUint16(offset);
        if (size < 2 || offset + size > bytes.length) return false;
        if ([0xc0, 0xc1, 0xc2].includes(marker)) {
          if (size < 8) return false;
          validDimensions = dimensions(
            view.getUint16(offset + 5),
            view.getUint16(offset + 3),
          );
          if (!validDimensions) return false;
        }
        offset += size;
      }
      return false;
    }
    if (
      bytes.length < 30 ||
      ascii(0, 4) !== "RIFF" ||
      ascii(8, 4) !== "WEBP" ||
      view.getUint32(4, true) !== bytes.length - 8
    )
      return false;
    let offset = 12;
    let validFrame = false;
    while (offset + 8 <= bytes.length) {
      const type = ascii(offset, 4);
      const size = view.getUint32(offset + 4, true);
      const data = offset + 8;
      if (size > bytes.length - data) return false;
      if (type === "VP8 ") {
        if (
          size < 10 ||
          bytes[data + 3] !== 0x9d ||
          bytes[data + 4] !== 1 ||
          bytes[data + 5] !== 0x2a
        )
          return false;
        validFrame = dimensions(
          view.getUint16(data + 6, true) & 0x3fff,
          view.getUint16(data + 8, true) & 0x3fff,
        );
        if (!validFrame) return false;
      } else if (type === "VP8L") {
        if (size < 5 || bytes[data] !== 0x2f) return false;
        const bits = view.getUint32(data + 1, true);
        validFrame = dimensions(
          (bits & 0x3fff) + 1,
          ((bits >>> 14) & 0x3fff) + 1,
        );
        if (!validFrame) return false;
      } else if (type === "VP8X") {
        if (size !== 10 || bytes[data] & 2) return false; // Animated images are not processed card photos.
        const width =
          1 +
          bytes[data + 4] +
          (bytes[data + 5] << 8) +
          (bytes[data + 6] << 16);
        const height =
          1 +
          bytes[data + 7] +
          (bytes[data + 8] << 8) +
          (bytes[data + 9] << 16);
        if (!dimensions(width, height)) return false;
      }
      offset = data + size + (size % 2);
    }
    return offset === bytes.length && validFrame;
  } catch {
    return false;
  }
}
const textFields = [
  "id",
  "name",
  "givenName",
  "familyName",
  "company",
  "title",
  "address",
  "notes",
  "rawText",
  "createdAt",
  "updatedAt",
] as const;
function readContact(input: unknown): Contact {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("A backup contact is invalid.");
  const item = input as Record<string, unknown>;
  if (item.schemaVersion !== 1)
    throw new Error("This contact schema version is not supported.");
  const out: Record<string, unknown> = { schemaVersion: 1 };
  for (const key of textFields) {
    if (typeof item[key] !== "string" || item[key].length > 100_000)
      throw new Error(`Invalid contact field: ${key}.`);
    out[key] = item[key];
  }
  if (
    !item.id ||
    !Number.isFinite(Date.parse(item.createdAt as string)) ||
    !Number.isFinite(Date.parse(item.updatedAt as string))
  )
    throw new Error("Invalid contact ID or timestamps.");
  for (const key of ["phones", "emails"] as const) {
    if (!Array.isArray(item[key]) || item[key].length > 100)
      throw new Error(`Invalid ${key} list.`);
    out[key] = item[key].map((entry: unknown) => {
      if (!entry || typeof entry !== "object")
        throw new Error(`Invalid ${key} entry.`);
      const value = entry as Record<string, unknown>;
      if (
        typeof value.label !== "string" ||
        value.label.length > 100 ||
        typeof value.value !== "string" ||
        value.value.length > 2000
      )
        throw new Error(`Invalid ${key} entry.`);
      return { label: value.label, value: value.value };
    });
  }
  if (
    !Array.isArray(item.websites) ||
    item.websites.length > 100 ||
    item.websites.some((v) => typeof v !== "string" || v.length > 2000)
  )
    throw new Error("Invalid websites list.");
  out.websites = [...item.websites];
  if (
    !Array.isArray(item.photos) ||
    item.photos.length > 2 ||
    item.photos.some((v) => typeof v !== "string" || !validatePhotoDataUrl(v))
  )
    throw new Error(
      "Invalid retained photos. Use valid processed PNG, JPEG, or WebP images up to 4096 pixels and 16 megapixels.",
    );
  out.photos = [...item.photos];
  const contact = out as unknown as Contact;
  if (validateContact(contact).length)
    throw new Error("A backup contact has no name, company, phone, or email.");
  return contact;
}
export function createBackup(
  contacts: Contact[],
  includePhotos = false,
): string {
  const json = JSON.stringify(
    {
      app: "STARRY Name Cards",
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      contacts: contacts.map((c) => ({
        ...c,
        photos: includePhotos ? c.photos : [],
      })),
    },
    null,
    2,
  );
  parseBackup(json);
  return json;
}
export function parseBackup(json: string): Contact[] {
  if (
    json.length > MAX_BACKUP_BYTES ||
    new TextEncoder().encode(json).byteLength > MAX_BACKUP_BYTES
  )
    throw new Error("Backup exceeds the 25 MB limit.");
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error("Choose a valid STARRY JSON backup file.");
  }
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw new Error("Invalid backup.");
  const backup = data as Record<string, unknown>;
  if (backup.app !== "STARRY Name Cards" || backup.schemaVersion !== 1)
    throw new Error("Unsupported backup format or version.");
  if (!Array.isArray(backup.contacts) || backup.contacts.length > 5000)
    throw new Error("Backup must contain at most 5,000 contacts.");
  const contacts = backup.contacts.map(readContact);
  if (new Set(contacts.map((c) => c.id)).size !== contacts.length)
    throw new Error("Backup contains repeated contact IDs.");
  return contacts;
}
