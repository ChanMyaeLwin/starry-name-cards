import { expect, it, vi } from "vitest";
import { localId } from "./id";
it("generates unique version 4 IDs when randomUUID is unavailable on HTTP", () => {
  const random = crypto.getRandomValues.bind(crypto);
  vi.stubGlobal("crypto", { getRandomValues: random });
  try {
    const ids = Array.from({ length: 100 }, localId);
    expect(new Set(ids).size).toBe(100);
    expect(
      ids.every((id) =>
        /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/.test(
          id,
        ),
      ),
    ).toBe(true);
  } finally {
    vi.unstubAllGlobals();
  }
});
