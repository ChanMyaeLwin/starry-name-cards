import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Dexie from "dexie";
import { emptyContact } from "./contact";
import { db, loadCards, restoreCards, saveCard } from "./storage";

beforeEach(async () => {
  await db.delete();
  await db.open();
});
afterEach(async () => {
  await db.delete();
});

describe("IndexedDB schema and persistence", () => {
  it("creates version 1 and preserves records across a close/open cycle", async () => {
    const contact = {
      ...emptyContact(),
      name: "Fictional Person",
      notes: "မြန်မာ",
    };
    await saveCard(contact);
    db.close();
    await db.open();
    const cards = await loadCards();
    expect(db.verno).toBe(1);
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      id: contact.id,
      name: contact.name,
      notes: contact.notes,
      schemaVersion: 1,
    });
  });
  it("opens a pre-existing version 1 database without losing data", async () => {
    await db.delete();
    const previous = new Dexie("starry-name-cards");
    previous
      .version(1)
      .stores({ cards: "id,name,company,createdAt,updatedAt" });
    const contact = { ...emptyContact(), company: "Fictional Studio" };
    await previous.table("cards").put(contact);
    previous.close();
    await db.open();
    expect(await loadCards()).toEqual([contact]);
  });
  it("updates the same ID and performs deletion persistently", async () => {
    const contact = { ...emptyContact(), name: "Original Fictional Name" };
    await saveCard(contact);
    await saveCard({ ...contact, name: "Updated Fictional Name" });
    expect((await loadCards()).map((c) => c.name)).toEqual([
      "Updated Fictional Name",
    ]);
    await db.cards.delete(contact.id);
    expect(await loadCards()).toEqual([]);
  });
  it("rolls back all restore writes after a simulated quota failure", async () => {
    const existing = { ...emptyContact(), name: "Existing fictional record" };
    await saveCard(existing);
    const before = await loadCards();
    const good = { ...emptyContact(), name: "New fictional record" };
    const failing = { ...emptyContact(), name: "Failing fictional record" };
    const failOnCreate = (_key: unknown, record: { id: string }) => {
      if (record.id === failing.id)
        throw new DOMException("Simulated full storage", "QuotaExceededError");
    };
    db.cards.hook("creating", failOnCreate);
    try {
      await expect(
        restoreCards([
          { ...existing, name: "Must roll back edit" },
          good,
          failing,
        ]),
      ).rejects.toThrow();
    } finally {
      db.cards.hook("creating").unsubscribe(failOnCreate);
    }
    expect(await loadCards()).toEqual(before);
    expect(failing.name).toBe("Failing fictional record");
  });
  it("propagates save failures without claiming persistence or mutating editable input", async () => {
    const contact = {
      ...emptyContact(),
      name: "Unsaved fictional record",
      updatedAt: "2025-01-01T00:00:00.000Z",
    };
    const fail = () => {
      throw new DOMException("Simulated full storage", "QuotaExceededError");
    };
    db.cards.hook("creating", fail);
    try {
      await expect(saveCard(contact)).rejects.toThrow();
    } finally {
      db.cards.hook("creating").unsubscribe(fail);
    }
    expect(contact.updatedAt).toBe("2025-01-01T00:00:00.000Z");
    expect(await loadCards()).toEqual([]);
  });
});
