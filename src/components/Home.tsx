import BrandIcon from "./BrandIcon";
import { ArrowRight, Check, ScanLine, ShieldCheck } from "lucide-react";

export interface HomeProps {
  t: (text: string) => string;
  cardsCount: number;
  start: () => void;
  openCards: () => void;
  offline: boolean;
  online: boolean;
  openSettings: () => void;
}

export default function Home({
  t,
  cardsCount,
  start,
  openCards,
  offline,
  online,
  openSettings,
}: HomeProps) {
  return (
    <>
      <section className="hero">
        <div className="eyebrow">
          <span /> {t("SMALL CARD. REAL CONNECTION.")}
        </div>
        <h1>
          {t("Your next connection,")}
          <br />
          <em>{t("kept close.")}</em>
        </h1>
        <p>
          {t("Turn a business card into a contact in a few simple steps.")}
          <br className="desktop" />{" "}
          {t("No accounts. No cloud uploads. Just you and your connections.")}
        </p>
      </section>
      <section className="actions" aria-label={t("Primary actions")}>
        <button className="action-card scan-card" onClick={start}>
          <div className="action-top">
            <span className="action-icon">
              <ScanLine size={29} />
            </span>
            <span className="action-chip">{t("START HERE")}</span>
          </div>
          <div className="card-illustration" aria-hidden="true">
            <div className="mini-card">
              <div className="mini-avatar">A</div>
              <div>
                <i />
                <i />
                <i />
              </div>
              <span>✦</span>
            </div>
            <span className="scan-corner tl" />
            <span className="scan-corner tr" />
            <span className="scan-corner bl" />
            <span className="scan-corner br" />
          </div>
          <div className="action-bottom">
            <div>
              <h2>{t("Scan a Name Card")}</h2>
              <p>{t("One photo. A new connection.")}</p>
            </div>
            <span className="round-arrow">
              <ArrowRight size={22} />
            </span>
          </div>
        </button>
        <button className="action-card collection-card" onClick={openCards}>
          <div className="action-top">
            <span className="action-icon">
              <BrandIcon size={40} />
            </span>
            <span className="count-chip">
              {cardsCount} {t("SAVED")}
            </span>
          </div>
          <div className="collection-illustration" aria-hidden="true">
            <div className="stack-card back" />
            <div className="stack-card middle" />
            <div className="stack-card front">
              <span className="avatar">JD</span>
              <div>
                <i />
                <i />
              </div>
              <span className="tiny-check">
                <Check size={12} />
              </span>
            </div>
          </div>
          <div className="action-bottom">
            <div>
              <h2>{t("My Name Cards")}</h2>
              <p>{t("Your people, all in one place.")}</p>
            </div>
            <span className="round-arrow">
              <ArrowRight size={22} />
            </span>
          </div>
        </button>
      </section>
      <section className="privacy-strip">
        <ShieldCheck size={22} />
        <p>
          {t("Your card photos and contact details stay on your device")}
          <br className="desktop" />{" "}
          {t("unless you choose to export or share them.")}
        </p>
      </section>
      <div className="offline-line">
        <span className={offline ? "status-dot ready" : "status-dot"} />
        {!online
          ? t("Device is offline")
          : offline
            ? t("Ready offline")
            : t("Offline setup available")}
        <span className="dot-divider">·</span>
        <button onClick={openSettings}>
          {t(offline ? "Manage offline access" : "Prepare for offline use")}{" "}
          <ArrowRight size={12} />
        </button>
      </div>
      <section className="steps">
        <span>{t("A LITTLE LESS TYPING. A LITTLE MORE CONNECTING.")}</span>
        <div>
          <p>
            <b>01</b> {t("Scan your card")}
          </p>
          <ArrowRight size={15} />
          <p>
            <b>02</b> {t("Check the details")}
          </p>
          <ArrowRight size={15} />
          <p>
            <b>03</b> {t("Keep the connection")}
          </p>
        </div>
      </section>
    </>
  );
}
