import { House, UsersRound, Settings, Ellipsis } from "lucide-react";
import { routeURL, type Page } from "../lib/routes";
export default function AppNav({
  page,
  go,
  t,
}: {
  page: Page;
  go: (p: Page) => void;
  t: (s: string) => string;
}) {
  const active = ["profile", "privacy", "help"].includes(page)
    ? "more"
    : page === "edit"
      ? "cards"
      : page === "scan"
        ? "home"
        : page;
  return (
    <nav className="app-nav" aria-label="Main navigation">
      {(
        [
          { page: "home", label: "Home", Icon: House },
          { page: "cards", label: "Connections", Icon: UsersRound },
          { page: "settings", label: "Settings", Icon: Settings },
          { page: "more", label: "More", Icon: Ellipsis },
        ] as const
      ).map(({ page: target, label, Icon }) => (
        <a
          key={target}
          href={routeURL(target)}
          aria-current={active === target ? "page" : undefined}
          onClick={(e) => {
            if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
              e.preventDefault();
              go(target);
            }
          }}
        >
          <Icon size={21} />
          <span>{t(label)}</span>
        </a>
      ))}
    </nav>
  );
}
