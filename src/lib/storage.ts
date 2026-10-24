import Dexie, { type Table } from "dexie";
import type { Contact } from "./contact";
class CardDB extends Dexie {
  cards!: Table<Contact, string>;
  constructor() {
    super("starry-name-cards");
    this.version(1).stores({ cards: "id,name,company,createdAt,updatedAt" });
  }
}
export const db = new CardDB();
export const loadCards = () => db.cards.toArray();
export async function saveCard(card: Contact) {
  await db.transaction("rw", db.cards, () =>
    db.cards.put({ ...card, updatedAt: new Date().toISOString() }),
  );
}
export async function restoreCards(cards: Contact[]) {
  await db.transaction("rw", db.cards, () => db.cards.bulkPut(cards));
}
