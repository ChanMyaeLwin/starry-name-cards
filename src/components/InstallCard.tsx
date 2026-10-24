import { useState } from "react";
import { Download, Check, Smartphone } from "lucide-react";
import type { useInstall } from "../lib/useInstall";
export default function InstallCard({
  installation,
  t,
}: {
  installation: ReturnType<typeof useInstall>;
  t: (s: string) => string;
}) {
  const [directions, setDirections] = useState(false);
  const ios =
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const android = /Android/.test(navigator.userAgent);
  return (
    <section
      className="settings-card install-guide"
      aria-labelledby="install-title"
    >
      <h2 id="install-title">{t("Keep STARRY on your home screen")}</h2>
      <p>{t("Open your connections with one tap, like any other app.")}</p>
      {installation.installed ? (
        <p className="installed-state">
          <Check size={18} />
          {t("STARRY is installed on this device.")}
        </p>
      ) : (
        <div className="button-row">
          <button
            className="primary"
            disabled={installation.pending}
            aria-controls={
              !installation.available ? "install-directions" : undefined
            }
            aria-expanded={!installation.available ? directions : undefined}
            onClick={async () => {
              await installation.install();
              setDirections(true);
            }}
          >
            <Download size={17} />
            {t(installation.pending ? "Opening…" : "Add to home screen")}
          </button>
          <button
            aria-expanded={directions}
            aria-controls="install-directions"
            onClick={() => setDirections((v) => !v)}
          >
            <Smartphone size={17} />
            {t("Show directions")}
          </button>
        </div>
      )}
      {installation.message && <p role="status">{t(installation.message)}</p>}
      {directions && !installation.installed && (
        <div id="install-directions" className="install-directions">
          {!window.isSecureContext && (
            <p className="install-requirement" role="status">
              {t(
                "This Wi-Fi preview uses HTTP. Full app installation and offline scanning need an HTTPS address. You can still test screens and save contacts here; your browser may offer a home-screen shortcut.",
              )}
            </p>
          )}
          <h3>
            {t(
              ios
                ? "On iPhone or iPad"
                : android
                  ? "On Android"
                  : "On your computer",
            )}
          </h3>
          <ol>
            {(ios
              ? [
                  "Open this address in Safari.",
                  "Tap Share (or More, then Share).",
                  "Choose Add to Home Screen, turn on Open as Web App if shown, then tap Add.",
                ]
              : android
                ? [
                    "Open this address in Chrome.",
                    "Tap the three-dot menu.",
                    "Choose Install app or Add to Home screen, then confirm.",
                  ]
                : [
                    "Open this address in Chrome or Edge.",
                    "Choose the install icon in the address bar, or Install from the browser menu.",
                    "Confirm installation, then launch STARRY from your apps.",
                  ]
            ).map((step) => (
              <li key={step}>{t(step)}</li>
            ))}
          </ol>
          <p>
            {t(
              "If no install option appears, open the app in your regular browser instead of an in-app browser. Availability depends on your browser and device.",
            )}
          </p>
        </div>
      )}
      <small>
        {t(
          "Prepare offline access in Settings before using OCR without an internet connection.",
        )}
      </small>
    </section>
  );
}
