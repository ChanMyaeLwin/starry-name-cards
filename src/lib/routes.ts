export type Page =
  | "home"
  | "scan"
  | "edit"
  | "cards"
  | "settings"
  | "privacy"
  | "help"
  | "more"
  | "profile"
  | "notfound";
export type Route = { page: Page; id?: string };
const paths: Record<Page, string> = {
  home: "/home",
  scan: "/scan",
  edit: "/review",
  cards: "/connections",
  settings: "/settings",
  privacy: "/privacy",
  help: "/help",
  more: "/more",
  profile: "/profile",
  notfound: "/not-found",
};
export function routeURL(page: Page, id?: string) {
  return `#${page === "edit" && id ? `/connections/${encodeURIComponent(id)}` : paths[page]}`;
}
export function readRoute(hash = location.hash): Route {
  const path = hash.replace(/^#/, "").replace(/\/$/, "") || "/home";
  const item = Object.entries(paths).find(([, v]) => v === path);
  if (item) return { page: item[0] as Page };
  const match = path.match(/^\/connections\/([a-zA-Z0-9-]{1,100})$/);
  return match ? { page: "edit", id: match[1] } : { page: "notfound" };
}
