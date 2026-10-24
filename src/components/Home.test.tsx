// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import Home from "./Home";
afterEach(cleanup);
const props = {
  t: (s: string) => s,
  cardsCount: 0,
  start: vi.fn(),
  openCards: vi.fn(),
  offline: false,
  online: true,
  openSettings: vi.fn(),
};
describe("home navigation and truthful offline status", () => {
  it("offers exactly the two main entry points and opens scanning", () => {
    render(<Home {...props} />);
    const actions = screen.getByRole("region", { name: "Primary actions" });
    expect(actions.querySelectorAll("button")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: /Scan a Name Card/ }));
    expect(props.start).toHaveBeenCalledOnce();
  });
  it("does not imply that being online means offline assets are ready", () => {
    render(<Home {...props} />);
    expect(screen.queryByText("Ready offline")).toBeNull();
    expect(screen.getByText("Offline setup available")).toBeTruthy();
  });
  it("shows device connectivity separately when prepared but disconnected", () => {
    render(<Home {...props} offline online={false} />);
    expect(screen.getByText("Device is offline")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Manage offline access/ }),
    ).toBeTruthy();
  });
});
