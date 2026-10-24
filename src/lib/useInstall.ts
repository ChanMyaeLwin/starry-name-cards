import { useEffect, useState } from "react";
export interface InstallEvent extends Event {
  prompt(): Promise<{ outcome: "accepted" | "dismissed" } | void>;
  userChoice?: Promise<{ outcome: "accepted" | "dismissed" }>;
}
export function useInstall() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null),
    [installed, setInstalled] = useState(false),
    [pending, setPending] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    const display = window.matchMedia("(display-mode: standalone)");
    const check = () =>
      setInstalled(
        display.matches ||
          (navigator as Navigator & { standalone?: boolean }).standalone ===
            true,
      );
    const available = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallEvent);
    };
    const complete = () => {
      setInstalled(true);
      setPrompt(null);
      setMessage("App installed. Open STARRY from your home screen.");
    };
    check();
    display.addEventListener("change", check);
    window.addEventListener("beforeinstallprompt", available);
    window.addEventListener("appinstalled", complete);
    return () => {
      display.removeEventListener("change", check);
      window.removeEventListener("beforeinstallprompt", available);
      window.removeEventListener("appinstalled", complete);
    };
  }, []);
  async function install() {
    if (!prompt || pending) return false;
    setPending(true);
    setPrompt(null);
    try {
      const result = await prompt.prompt();
      const choice = prompt.userChoice ? await prompt.userChoice : result;
      setMessage(
        choice?.outcome === "accepted"
          ? "Installation requested. Follow your browser to finish."
          : "Installation cancelled. You can try again from your browser menu.",
      );
    } catch {
      setMessage(
        "The install prompt could not open. Follow the directions below.",
      );
    } finally {
      setPending(false);
    }
    return true;
  }
  return { available: !!prompt, installed, pending, message, install };
}
