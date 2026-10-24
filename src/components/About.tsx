import GitHubIcon from "./GitHubIcon";
import BrandIcon from "./BrandIcon";
import { SOURCE_URL, STARRY_URL } from "../lib/project";
export default function About({ t }: { t: (text: string) => string }) {
  return (
    <section className="panel prose about-page">
      <div className="inline-brand-heading">
        <BrandIcon size={48} />
        <h1>{t("About STARRY Name Cards")}</h1>
      </div>
      <a
        className="company-logo-link"
        href={STARRY_URL}
        target="_blank"
        rel="noreferrer"
      >
        <img
          className="company-logo"
          src={`${import.meta.env.BASE_URL}starry-solutions-logo.png`}
          alt="STARRY Solutions — Work with Heart & Empathy"
          width="1434"
          height="1097"
        />
      </a>
      <p>
        {t("A free community project by")}{" "}
        <a href={STARRY_URL} target="_blank" rel="noreferrer">
          STARRY Solutions
        </a>
        .
      </p>
      <div className="settings-card">
        <h2>{t("Why we created this app")}</h2>
        <p>
          {t(
            "A business card can be the beginning of a meaningful connection. We created STARRY Name Cards to make keeping that connection easier: turn a card into a contact without typing every detail by hand.",
          )}
        </p>
        <p>
          {t(
            "As a community contribution, the app is free to use, with no account, subscription, or advertising. Recognition happens on your device, so your card photos and contact details stay with you unless you choose to export or share them.",
          )}
        </p>
      </div>
      <div className="settings-card">
        <h2>{t("Built for everyday connections")}</h2>
        <p>
          {t(
            "Download English and Myanmar OCR together, scan a card, check the details, and save or share the contact. Once prepared, the app can work offline. Myanmar recognition is experimental, and all scanned details should be reviewed.",
          )}
        </p>
      </div>
      <div className="settings-card">
        <h2>{t("Made to grow with the community")}</h2>
        <p>
          {t(
            "The source code is public and contributions are welcome. Help improve the app with code, translations, accessibility feedback, bug reports, or ideas.",
          )}
        </p>
        <a
          className="button"
          href={SOURCE_URL}
          target="_blank"
          rel="noreferrer"
        >
          <GitHubIcon />
          {t("GitHub repository")}
        </a>
      </div>
    </section>
  );
}
