import GitHubIcon from "./components/GitHubIcon";
import About from "./components/About";
import { SOURCE_URL, STARRY_URL } from "./lib/project";
import BrandIcon from "./components/BrandIcon";
import { useConfirmation } from "./lib/useConfirmation";
import MessageDialog from "./components/MessageDialog";
import InstallCard from "./components/InstallCard";
import { useInstall } from "./lib/useInstall";
import { localId } from "./lib/id";
import AppNav from "./components/AppNav";
import Profile, { PROFILE_KEY } from "./components/Profile";
import { readRoute, routeURL, type Page } from "./lib/routes";
import * as offlineTools from "./lib/offline";
import Home from "./components/Home";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  ScanLine,
  ShieldCheck,
  Plus,
  Search,
  Upload,
  Camera,
  Download,
  Trash2,
  RotateCw,
  Crop,
  X,
  Check,
  Globe,
  FileText,
  Share2,
  QrCode,
  UserRound,
  ChevronRight,
  CircleHelp,
} from "lucide-react";
import {
  emptyContact,
  parseContactText,
  validateContact,
  findDuplicates,
  toVCard,
  contactFilename,
  type Contact,
} from "./lib/contact";
import { db, loadCards, saveCard, restoreCards } from "./lib/storage";
import {
  parseBackupAsync,
  createBackupAsync,
  exportVCardsAsync,
} from "./lib/backup";
import { translations } from "./lib/i18n";
import { processImage, transformImage } from "./lib/images";
import { recognizeImages, cancelOCR } from "./lib/ocr";

function download(
  data: Blob | string,
  name: string,
  type = "text/vcard;charset=utf-8",
) {
  const url = URL.createObjectURL(
    typeof data === "string" ? new Blob([data], { type }) : data,
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const installation = useInstall();
  const confirmation = useConfirmation();
  const historyPending = useRef(false);
  const exitApproved = useRef(false);
  const [ocrDownload, setOcrDownload] = useState(false);
  const [packInfo, setPackInfo] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [page, setPageState] = useState<Page>(() => readRoute().page),
    [cards, setCards] = useState<Contact[]>([]),
    [draft, setDraft] = useState<Contact>(emptyContact),
    [images, setImages] = useState<string[]>([]),
    [retain, setRetain] = useState(false),
    [language, setLanguage] = useState(
      (() => {
        try {
          return localStorage.getItem("starry-ui") || "en";
        } catch {
          return "en";
        }
      })(),
    ),
    [ocrLanguage, setOcrLanguage] = useState<"eng" | "mya" | "eng+mya">("eng"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [status, setStatus] = useState(""),
    [online, setOnline] = useState(navigator.onLine),
    [search, setSearch] = useState(""),
    [sort, setSort] = useState("recent"),
    [duplicates, setDuplicates] = useState<Contact[]>([]),
    [imported, setImported] = useState<Contact[] | null>(null),
    [qr, setQr] = useState(""),
    [qrFields, setQrFields] = useState({
      phone: true,
      email: true,
      company: true,
    }),
    [cropIndex, setCropIndex] = useState<number | null>(null),
    [crop, setCrop] = useState({ x: 0, y: 0, w: 100, h: 100 }),
    [offline, setOffline] = useState(false),
    [packStatus, setPackStatus] = useState(""),
    [update, setUpdate] = useState<ServiceWorker | null>(null);
  useEffect(() => {
    if (message || confirmation.message) return;
    const dialog = document.querySelector<HTMLElement>("[role=dialog]");
    if (!dialog) return;
    const previous = document.activeElement as HTMLElement;
    const elements = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          "button,input,select,textarea,a[href]",
        ),
      ).filter((e) => !e.hasAttribute("disabled"));
    elements()[0]?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDuplicates([]);
        setImported(null);
        setCropIndex(null);
        offlineTools.cancelPreparation();
        setOcrDownload(false);
      }
      if (e.key === "Tab") {
        const list = elements(),
          first = list[0],
          last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [
    duplicates.length,
    imported,
    cropIndex,
    ocrDownload,
    message,
    confirmation.message,
  ]);
  const fileRef = useRef<HTMLInputElement>(null),
    cameraRef = useRef<HTMLInputElement>(null),
    importRef = useRef<HTMLInputElement>(null),
    cancelled = useRef(false);
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  useEffect(() => {
    if (page !== "edit") return;
    const warn = (e: BeforeUnloadEvent) => {
      if (exitApproved.current) return;
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [page]);
  useEffect(() => {
    if (installation.message) setMessage(installation.message);
  }, [installation.message]);
  const t = (text: string) =>
    language === "my" ? translations[text] || text : text;
  async function checkOffline() {
    const m = offlineTools;
    const s = await m.getOfflineStatus();
    setOffline(s.shell && s.eng && s.mya);
    setPackInfo(
      `English: ${s.eng ? "installed" : "not installed"} (${(s.englishBytes / 1048576).toFixed(1)} MB). Myanmar: ${s.mya ? "installed" : "not installed"} (+${(s.myanmarBytes / 1048576).toFixed(1)} MB).`,
    );
  }
  useEffect(() => {
    void checkOffline();
  }, [page, ocrLanguage]);
  const refresh = () =>
    loadCards()
      .then(setCards)
      .catch(() =>
        setMessage(
          "Browser storage is unavailable. You can still enter and download a contact.",
        ),
      );
  useEffect(() => {
    void refresh();
    void checkOffline();
    const change = () => {
      setOnline(navigator.onLine);
      void checkOffline();
    };
    window.addEventListener("online", change);
    window.addEventListener("offline", change);
    if ("serviceWorker" in navigator && import.meta.env.PROD) {
      void navigator.serviceWorker
        .register(`${import.meta.env.BASE_URL}sw.js`)
        .then((reg) => {
          void navigator.serviceWorker.ready.then(() => checkOffline());
          if (reg.waiting) setUpdate(reg.waiting);
          reg.addEventListener("updatefound", () =>
            reg.installing?.addEventListener("statechange", () => {
              if (reg.waiting && navigator.serviceWorker.controller)
                setUpdate(reg.waiting);
            }),
          );
        })
        .catch(() =>
          setMessage("Offline preparation is unavailable in this browser."),
        );
    }
    return () => {
      window.removeEventListener("online", change);
      window.removeEventListener("offline", change);
    };
  }, []);
  const currentURL = useRef(location.hash || routeURL("home"));
  const routeVersion = useRef(0);
  function setPage(next: Page, id?: string) {
    routeVersion.current++;
    if (page === "scan" && next !== "scan") {
      cancelled.current = true;
      cancelOCR();
      setBusy(false);
    }
    const url = routeURL(next, id);
    if (location.hash !== url) history.pushState({ starryApp: true }, "", url);
    currentURL.current = url;
    setPageState(next);
    document.title = `${next === "cards" ? "Connections" : next.charAt(0).toUpperCase() + next.slice(1)} · STARRY Name Cards`;
  }
  async function restoreRoute() {
    const route = readRoute();
    const version = ++routeVersion.current;
    document.title = `${route.page === "cards" ? "Connections" : route.page.charAt(0).toUpperCase() + route.page.slice(1)} · STARRY Name Cards`;
    setPageState(route.page);
    currentURL.current = location.hash || routeURL("home");
    setMessage("");
    setQr("");
    if (route.page === "edit") {
      if (route.id) {
        try {
          const card = await db.cards.get(route.id);
          if (version !== routeVersion.current) return;
          if (card) {
            setDraft(card);
            setImages(card.photos || []);
            setRetain(!!card.photos?.length);
          } else {
            setPageState("notfound");
          }
        } catch {
          setMessage("Could not open this connection. Please try again.");
        }
      } else {
        setDraft(emptyContact());
        setImages([]);
        setRetain(false);
      }
    }
    window.scrollTo(0, 0);
  }
  useEffect(() => {
    if (!location.hash)
      history.replaceState(history.state, "", routeURL("home"));
    if (!history.state?.starryApp) {
      history.replaceState(
        {
          starryApp: true,
          starryExitGuard: true,
          canGoBack: history.length > 1,
        },
        "",
      );
      history.pushState({ starryApp: true }, "");
    } else if (history.state?.starryExitGuard) {
      history.pushState({ starryApp: true }, "");
    }
    const resetExit = () => {
      exitApproved.current = false;
    };
    window.addEventListener("pageshow", resetExit);
    void restoreRoute();
    return () => window.removeEventListener("pageshow", resetExit);
  }, []);
  useEffect(() => {
    async function onHistory() {
      if (historyPending.current) return;
      historyPending.current = true;
      try {
        if (exitApproved.current) return;
        if (history.state?.starryExitGuard) {
          const canGoBack = history.state.canGoBack;
          history.pushState({ starryApp: true }, "", currentURL.current);
          const accepted = await confirmation.ask(
            page === "edit"
              ? "Exit STARRY? Unsaved changes will be lost."
              : "Do you want to exit STARRY? Your saved cards will stay on this device.",
            { title: "Exit STARRY?", confirm: "Exit", cancel: "Stay" },
          );
          if (accepted) {
            exitApproved.current = true;
            if (canGoBack) history.go(-2);
            else {
              window.close();
              window.setTimeout(() => {
                exitApproved.current = false;
                setMessage(
                  "Your browser cannot close this app automatically. Close this tab or use your phone’s Home gesture to leave.",
                );
              }, 300);
            }
          }
          return;
        }
        if (location.hash === currentURL.current) return;
        if (
          page === "edit" &&
          !(await confirmation.ask(
            "Leave this form? Unsaved changes will be lost.",
          ))
        ) {
          history.pushState({ starryApp: true }, "", currentURL.current);
          return;
        }
        cancelled.current = true;
        cancelOCR();
        setBusy(false);
        await restoreRoute();
      } finally {
        historyPending.current = false;
      }
    }
    window.addEventListener("popstate", onHistory);
    window.addEventListener("hashchange", onHistory);
    return () => {
      window.removeEventListener("popstate", onHistory);
      window.removeEventListener("hashchange", onHistory);
    };
  }, [page]);
  async function go(next: Page) {
    if (
      page === "edit" &&
      next !== "edit" &&
      !(await confirmation.ask(
        "Leave this form? Unsaved changes will be lost.",
      ))
    )
      return false;
    setPage(next);
    setMessage("");
    setQr("");
    window.scrollTo(0, 0);
    return true;
  }
  async function start() {
    if (!(await go("scan"))) return;
    setDraft(emptyContact());
    setImages([]);
    setRetain(false);
  }
  function edit(card: Contact) {
    setDraft(structuredClone(card));
    setImages(card.photos || []);
    setRetain(!!card.photos?.length);
    setPage("edit", card.id);
  }
  async function addImages(files: FileList | null) {
    if (!files) return;
    try {
      const processed = await Promise.all(
        Array.from(files)
          .slice(0, 2 - images.length)
          .map(processImage),
      );
      setImages((prev) => [...prev, ...processed]);
    } catch (e) {
      setMessage((e as Error).message);
    }
    if (fileRef.current) fileRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  }
  async function read() {
    setBusy(true);
    cancelled.current = false;
    setMessage("");
    try {
      const ready = await offlineTools.getOfflineStatus();
      if (cancelled.current) return;
      if (
        ocrLanguage.split("+").some((lang) => !ready[lang as "eng" | "mya"])
      ) {
        setPackStatus("");
        setDownloadProgress(0);
        setOcrDownload(true);
        return;
      }
      const text = await recognizeImages(images, ocrLanguage, (p, s) => {
        setProgress(p);
        setStatus(s);
      });
      if (!cancelled.current) {
        setDraft(parseContactText(text));
        setPage("edit");
      }
    } catch (e) {
      if (!cancelled.current)
        setMessage(
          (e as Error).message || "Unable to read the image. Try manual entry.",
        );
    } finally {
      setBusy(false);
    }
  }
  async function save(separately = false) {
    const errors = validateContact(draft);
    if (errors.length) {
      setMessage(errors.join(" "));
      return;
    }
    const candidate = { ...draft, photos: retain ? images : [] };
    const matches = findDuplicates(
      candidate,
      cards.filter((c) => c.id !== draft.id),
    );
    if (matches.length && !separately) {
      setDuplicates(matches);
      return;
    }
    try {
      await saveCard(candidate);
      await refresh();
      setDuplicates([]);
      setPage("cards");
      setMessage("Card saved in this browser.");
    } catch {
      setMessage(
        "Could not save. Browser storage may be full or unavailable. Your details are still here; download the contact to keep a copy.",
      );
    }
  }
  function exportOne() {
    const errors = validateContact(draft);
    if (errors.length) return setMessage(errors.join(" "));
    download(toVCard(draft), contactFilename(draft));
    setMessage(
      "Contact file downloaded. Open it to import using your device’s contacts app.",
    );
  }
  async function share() {
    if (validateContact(draft).length)
      return setMessage("Add a name, company, phone number, or email first.");
    const file = new File([toVCard(draft)], contactFilename(draft), {
      type: "text/vcard",
    });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
      } catch (e) {
        if ((e as Error).name !== "AbortError")
          setMessage("Sharing failed. Download the contact instead.");
      }
    } else {
      exportOne();
      setMessage(
        "File sharing is unavailable. Your contact was downloaded instead.",
      );
    }
  }
  async function makeQR() {
    if (validateContact(draft).length) {
      setMessage("Add a name, company, phone number, or email first.");
      return;
    }
    try {
      const { default: QRCode } = await import("qrcode");
      setQr(
        await QRCode.toDataURL(
          toVCard({
            ...draft,
            phones: qrFields.phone ? draft.phones : [],
            emails: qrFields.email ? draft.emails : [],
            company: qrFields.company ? draft.company : "",
            notes: "",
            rawText: "",
            photos: [],
            address: "",
            websites: [],
          }),
          { width: 320, margin: 2 },
        ),
      );
    } catch {
      setMessage(
        "Too much contact information for a QR code. Include fewer details.",
      );
    }
  }
  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 25 * 1024 * 1024)
        throw new Error("Backup must be smaller than 25 MB.");
      setImported(await parseBackupAsync(await file.text()));
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  async function restore() {
    if (!imported) return;
    try {
      const all = [...cards];
      for (const importedCard of imported) {
        const card = { ...importedCard, id: localId() };
        const match = findDuplicates(card, all);
        if (
          match.length &&
          !(await confirmation.ask(
            `Possible duplicate: ${card.name || card.company}. Import as a separate card? Cancel skips this card.`,
          ))
        )
          continue;
        all.push({ ...card, id: localId() });
      }
      await restoreCards(all);
      setImported(null);
      await refresh();
      setMessage("Backup restored.");
    } catch {
      setMessage(
        "Restore failed. No partial changes were saved. Check available browser storage.",
      );
    }
  }
  async function prepare() {
    setPreparing(true);
    try {
      const mod = offlineTools;
      await mod.prepareLanguage("eng+mya", (p: number, s?: string) => {
        setDownloadProgress(p);
        setPackStatus(s || "Preparing offline assets…");
      });
      await checkOffline();
      setPackStatus(
        "English and Myanmar downloaded. You can scan with both on this device.",
      );
      if (!ocrDownload)
        setMessage(
          "English and Myanmar downloaded. You can scan with both on this device.",
        );
      return true;
    } catch (e) {
      setOffline(false);
      setPackStatus((e as Error).message);
      if (!ocrDownload) setMessage((e as Error).message);
      return false;
    } finally {
      setPreparing(false);
    }
  }
  const set = (key: keyof Contact, value: unknown) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const visible = cards
    .filter((c) =>
      [
        c.name,
        c.company,
        ...c.phones.map((p) => p.value),
        ...c.emails.map((p) => p.value),
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : b.createdAt.localeCompare(a.createdAt),
    );
  return (
    <div className="app">
      <header className="header">
        <button
          className="brand"
          onClick={() => go("home")}
          aria-label="STARRY Name Cards home"
        >
          <BrandIcon />
          <span>
            <strong>
              STARRY<span className="brand-divider"> / </span>
            </strong>
            <span className="brand-product">Name Cards</span>
          </span>
        </button>
        <div className="header-right">
          <span className="private-badge">
            <ShieldCheck size={14} /> Private by design
          </span>
          <button
            className="language"
            onClick={() => {
              const l = language === "en" ? "my" : "en";
              setLanguage(l);
              try {
                localStorage.setItem("starry-ui", l);
              } catch {
                /* Language still changes for this visit. */
              }
              document.documentElement.lang = l === "my" ? "my" : "en";
            }}
          >
            <Globe size={15} />
            {language === "en" ? "EN / မြန်မာ" : "မြန်မာ / EN"}
          </button>
        </div>
      </header>
      <main>
        {update && (
          <div className="notice">
            {t("Update available. Save your work before updating.")}
            <button
              onClick={async () => {
                if (
                  await confirmation.ask(
                    "Reload to update? Unsaved work will be lost.",
                  )
                ) {
                  navigator.serviceWorker.addEventListener(
                    "controllerchange",
                    () => location.reload(),
                    { once: true },
                  );
                  update.postMessage("ACTIVATE_UPDATE");
                }
              }}
            >
              {t("Update now")}
            </button>
          </div>
        )}
        {page === "home" ? (
          <Home
            t={t}
            cardsCount={cards.length}
            start={start}
            openCards={() => go("cards")}
            offline={offline}
            online={online}
            openSettings={() => {
              void checkOffline();
              go("settings");
            }}
          />
        ) : (
          <>
            {!["cards", "settings", "more"].includes(page) && (
              <button
                className="back"
                onClick={() =>
                  go(
                    page === "edit"
                      ? "cards"
                      : ["privacy", "profile", "help"].includes(page)
                        ? "more"
                        : "home",
                  )
                }
              >
                <ArrowLeft size={16} />
                {t("Back")}
              </button>
            )}
            {page === "scan" && (
              <section className="panel">
                <div className="eyebrow">{t("A NEW CONNECTION")}</div>
                <h1>{t("Scan a Name Card")}</h1>
                <p>
                  {t(
                    "Place the card on a plain surface with good lighting. Keep all text visible.",
                  )}
                </p>
                <div className="upload-zone">
                  <ScanLine size={44} />
                  <h2>{t("Start with the front of your card")}</h2>
                  <p>{t("Add up to two images: front and optional back.")}</p>
                  <div className="button-row">
                    <button
                      className="primary"
                      disabled={images.length >= 2 || busy}
                      onClick={() => cameraRef.current?.click()}
                    >
                      <Camera size={18} />
                      {t("Take Photo")}
                    </button>
                    <button
                      disabled={images.length >= 2 || busy}
                      onClick={() => fileRef.current?.click()}
                    >
                      <Upload size={18} />
                      {t("Choose Photo")}
                    </button>
                  </div>
                  <small>
                    {t(
                      "JPEG, PNG, WebP, GIF or BMP \u00b7 up to 20 MB / 60 MP",
                    )}
                    <br />
                    {t(
                      "Images are resized to 2,400 px. HEIC may need conversion.",
                    )}
                  </small>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
                  multiple
                  hidden
                  onChange={(e) => void addImages(e.target.files)}
                />
                <input
                  ref={cameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  hidden
                  onChange={(e) => void addImages(e.target.files)}
                />
                <div className="image-grid">
                  {images.map((src, i) => (
                    <div key={i} className="image-card">
                      <img
                        src={src}
                        alt={`${i === 0 ? "Front" : "Back"} of business card`}
                      />
                      <div className="button-row">
                        <button
                          aria-label={`Rotate image ${i + 1}`}
                          onClick={async () => {
                            const next = await transformImage(src, true);
                            setImages((v) =>
                              v.map((s, j) => (j === i ? next : s)),
                            );
                          }}
                        >
                          <RotateCw size={16} />
                          {t("Rotate")}
                        </button>
                        <button
                          onClick={() => {
                            setCropIndex(i);
                            setCrop({ x: 0, y: 0, w: 100, h: 100 });
                          }}
                        >
                          <Crop size={16} />
                          {t("Crop")}
                        </button>
                        <button
                          aria-label="Remove image"
                          onClick={() =>
                            setImages((v) => v.filter((_, j) => j !== i))
                          }
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <label>
                  {t("OCR recognition language")}
                  <select
                    value={ocrLanguage}
                    onChange={(e) =>
                      setOcrLanguage(e.target.value as typeof ocrLanguage)
                    }
                  >
                    <option value="eng">{t("English")}</option>
                    <option value="mya">{t("Myanmar (experimental)")}</option>
                    <option value="eng+mya">
                      {t("English + Myanmar (experimental)")}
                    </option>
                  </select>
                </label>
                {busy ? (
                  <div role="status">
                    <progress value={progress} max={1} />
                    <p>{t(status)}</p>
                    <button
                      onClick={() => {
                        cancelled.current = true;
                        void cancelOCR();
                        setBusy(false);
                      }}
                    >
                      {t("Cancel reading")}
                    </button>
                  </div>
                ) : (
                  <div className="button-row">
                    <button
                      className="primary"
                      disabled={!images.length}
                      onClick={() => void read()}
                    >
                      <ScanLine size={18} />
                      {t("Read Card")}
                    </button>
                    <button onClick={() => setPage("edit")}>
                      {t("Enter Details Manually")}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </section>
            )}
            {page === "edit" && (
              <section className="panel">
                <div className="eyebrow">{t("MAKE IT YOURS")}</div>
                <h1>{t("Check the details")}</h1>
                <p>{t("Please check the details before saving.")}</p>
                <div className="review-layout">
                  <div>
                    <div className="image-grid">
                      {images.map((s, i) => (
                        <img
                          key={i}
                          className="review-photo"
                          src={s}
                          alt={`Card ${i + 1}`}
                        />
                      ))}
                    </div>
                    <div className="form-grid">
                      {(
                        [
                          "name",
                          "givenName",
                          "familyName",
                          "company",
                          "title",
                          "address",
                        ] as const
                      ).map((key, i) => (
                        <label key={key}>
                          {t(
                            [
                              "Full name",
                              "Given name (optional)",
                              "Family name (optional)",
                              "Company",
                              "Job title",
                              "Address",
                            ][i],
                          )}
                          <input
                            value={draft[key]}
                            onChange={(e) => set(key, e.target.value)}
                          />
                        </label>
                      ))}
                    </div>
                    {(["phones", "emails"] as const).map((key) => (
                      <fieldset key={key}>
                        <legend>
                          {key === "phones"
                            ? "Phone numbers"
                            : "Email addresses"}
                        </legend>
                        {draft[key].map((item, i) => (
                          <div className="repeat-row" key={i}>
                            <input
                              aria-label={`${key} label ${i + 1}`}
                              value={item.label}
                              onChange={(e) =>
                                set(
                                  key,
                                  draft[key].map((v, j) =>
                                    j === i
                                      ? { ...v, label: e.target.value }
                                      : v,
                                  ),
                                )
                              }
                            />
                            <input
                              aria-label={`${key} ${i + 1}`}
                              type={key === "phones" ? "tel" : "text"}
                              value={item.value}
                              onChange={(e) =>
                                set(
                                  key,
                                  draft[key].map((v, j) =>
                                    j === i
                                      ? { ...v, value: e.target.value }
                                      : v,
                                  ),
                                )
                              }
                            />
                            <button
                              aria-label={`Remove ${key} ${i + 1}`}
                              onClick={() =>
                                set(
                                  key,
                                  draft[key].filter((_, j) => j !== i),
                                )
                              }
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() =>
                            set(key, [
                              ...draft[key],
                              { label: "Work", value: "" },
                            ])
                          }
                        >
                          <Plus size={15} />
                          Add {key === "phones" ? "phone" : "email"}
                        </button>
                      </fieldset>
                    ))}
                    <fieldset>
                      <legend>{t("Websites")}</legend>
                      {draft.websites.map((v, i) => (
                        <div className="repeat-row" key={i}>
                          <input
                            aria-label={`Website ${i + 1}`}
                            value={v}
                            onChange={(e) =>
                              set(
                                "websites",
                                draft.websites.map((s, j) =>
                                  j === i ? e.target.value : s,
                                ),
                              )
                            }
                          />
                          <button
                            aria-label="Remove website"
                            onClick={() =>
                              set(
                                "websites",
                                draft.websites.filter((_, j) => j !== i),
                              )
                            }
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => set("websites", [...draft.websites, ""])}
                      >
                        <Plus size={15} />
                        {t("Add website")}
                      </button>
                    </fieldset>
                    <label>
                      {t("Notes")}
                      <textarea
                        value={draft.notes}
                        onChange={(e) => set("notes", e.target.value)}
                      />
                    </label>
                    <details>
                      <summary>{t("Raw recognized text")}</summary>
                      <textarea
                        aria-label="Raw recognized text"
                        value={draft.rawText}
                        onChange={(e) => set("rawText", e.target.value)}
                      />
                      <button
                        onClick={async () => {
                          try {
                            if (!navigator.clipboard)
                              throw new Error("unavailable");
                            await navigator.clipboard.writeText(draft.rawText);
                            setMessage("Recognized text copied.");
                          } catch {
                            setMessage("Select the text and copy it manually.");
                          }
                        }}
                      >
                        {t("Copy text")}
                      </button>
                    </details>
                    {images.length > 0 && (
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          checked={retain}
                          onChange={(e) => setRetain(e.target.checked)}
                        />
                        {t(
                          "Retain processed card photos. This uses more device storage.",
                        )}
                      </label>
                    )}
                  </div>
                  <aside className="save-panel">
                    <ShieldCheck size={24} />
                    <h3>{t("A contact, on your terms.")}</h3>
                    <p>
                      {t(
                        "Saving keeps this card in this browser. Downloading or sharing creates a contact file without saving it.",
                      )}
                    </p>
                    <button className="primary" onClick={() => void save()}>
                      <Check size={17} />
                      {t("Save to My Name Cards")}
                    </button>
                    <button onClick={exportOne}>
                      <Download size={17} />
                      {t("Download Contact (.vcf)")}
                    </button>
                    <button onClick={() => void share()}>
                      <Share2 size={17} />
                      {t("Share Contact")}
                    </button>
                    <details>
                      <summary>{t("Contact QR code")}</summary>
                      <p>
                        {t(
                          "Includes full name and selected details. Anyone who scans it can read them.",
                        )}
                      </p>
                      {(["phone", "email", "company"] as const).map((k) => (
                        <label className="checkbox" key={k}>
                          <input
                            type="checkbox"
                            checked={qrFields[k]}
                            onChange={(e) => {
                              setQr("");
                              setQrFields((v) => ({
                                ...v,
                                [k]: e.target.checked,
                              }));
                            }}
                          />
                          {k}
                        </label>
                      ))}
                      <p aria-label="QR details preview">
                        {[
                          draft.name,
                          qrFields.company ? draft.company : "",
                          ...(qrFields.phone
                            ? draft.phones.map((v) => v.value)
                            : []),
                          ...(qrFields.email
                            ? draft.emails.map((v) => v.value)
                            : []),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <button onClick={() => void makeQR()}>
                        <QrCode size={17} />
                        {t("Generate QR")}
                      </button>
                      {qr && (
                        <>
                          <img src={qr} alt="Contact QR code" />
                          <a
                            className="button"
                            href={qr}
                            download="contact-qr.png"
                          >
                            {t("Download QR")}
                          </a>
                        </>
                      )}
                    </details>
                    <small>
                      {t(
                        "Your device controls importing the downloaded file into contacts.",
                      )}
                    </small>
                  </aside>
                </div>
              </section>
            )}
            {page === "cards" && (
              <section className="panel">
                <div className="section-heading">
                  <div>
                    <div className="eyebrow">{t("YOUR CONNECTIONS")}</div>
                    <h1>
                      {t("Connections")}{" "}
                      <span className="number">{cards.length}</span>
                    </h1>
                  </div>
                  <button className="primary" onClick={start}>
                    <Plus size={18} />
                    {t("Scan a card")}
                  </button>
                </div>
                <p className="storage-reminder">
                  {t(
                    "Cards are stored in this browser on this device. Clearing browser data or losing your device may remove them. Export a backup to keep a copy.",
                  )}
                </p>
                <div className="toolbar">
                  <label className="search">
                    <Search size={18} />
                    <input
                      aria-label="Search your cards"
                      placeholder={t("Search your cards")}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  <select
                    aria-label="Sort cards"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="recent">{t("Recently added")}</option>
                    <option value="name">{t("Name")}</option>
                  </select>
                </div>
                {!cards.length ? (
                  <div className="empty">
                    <BrandIcon size={64} />
                    <h2>{t("Your next connection starts here.")}</h2>
                    <p>{t("Scan a card or enter the details yourself.")}</p>
                    <button className="primary" onClick={start}>
                      {t("Scan a Name Card")}
                      <ArrowRight size={17} />
                    </button>
                  </div>
                ) : (
                  <div className="contact-list">
                    {visible.map((c) => (
                      <article className="contact-item" key={c.id}>
                        <button
                          className="contact-open"
                          onClick={() => edit(c)}
                        >
                          <span className="avatar">
                            {c.name.slice(0, 2).toUpperCase() || "SC"}
                          </span>
                          <span>
                            <strong>{c.name || c.company || "Contact"}</strong>
                            <small>
                              {c.company ||
                                c.emails[0]?.value ||
                                c.phones[0]?.value}
                            </small>
                          </span>
                          <ArrowRight size={18} />
                        </button>
                        <button
                          aria-label={`Download ${c.name}`}
                          onClick={() =>
                            download(toVCard(c), contactFilename(c))
                          }
                        >
                          <Download size={17} />
                        </button>
                        <button
                          aria-label={`Delete ${c.name}`}
                          onClick={async () => {
                            if (
                              await confirmation.ask(
                                `Delete ${c.name || "this card"}?`,
                              )
                            ) {
                              try {
                                await db.cards.delete(c.id);
                                await refresh();
                              } catch {
                                setMessage(
                                  "Could not delete this card. Try again.",
                                );
                              }
                            }
                          }}
                        >
                          <Trash2 size={17} />
                        </button>
                      </article>
                    ))}
                  </div>
                )}
                <div className="button-row export-row">
                  <button
                    disabled={!cards.length}
                    onClick={async () => {
                      try {
                        download(
                          await exportVCardsAsync(cards),
                          "starry-contacts.vcf",
                        );
                      } catch (e) {
                        setMessage((e as Error).message);
                      }
                    }}
                  >
                    <Download size={17} />
                    {t("Export all contacts")}
                  </button>
                  <button
                    disabled={!cards.length}
                    onClick={async () => {
                      if (
                        await confirmation.ask(
                          "This JSON backup is unencrypted and contains contact details. Continue?",
                        )
                      ) {
                        const include = await confirmation.ask(
                          "Include retained card photos in this backup? Cancel exports contact data only.",
                        );
                        try {
                          download(
                            await createBackupAsync(cards, include),
                            "starry-backup.json",
                            "application/json",
                          );
                        } catch (e) {
                          setMessage((e as Error).message);
                        }
                      }
                    }}
                  >
                    <FileText size={17} />
                    {t("Export JSON backup")}
                  </button>
                  <button onClick={() => importRef.current?.click()}>
                    <Upload size={17} />
                    {t("Restore backup")}
                  </button>
                  <input
                    hidden
                    ref={importRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={(e) => {
                      void importFile(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </div>
                <small>
                  {t(
                    "VCF exports contacts. JSON backups restore your app collection.",
                  )}
                </small>
              </section>
            )}
            {page === "more" && (
              <section className="panel more-page">
                <div className="page-intro">
                  <div className="eyebrow">STARRY NAME CARDS</div>
                  <h1>{t("More")}</h1>
                  <p>{t("Make yourself at home.")}</p>
                </div>
                <div className="menu-list">
                  {(
                    [
                      {
                        target: "profile",
                        title: "Profile",
                        description: "Your details, on this device",
                        Icon: UserRound,
                      },
                      {
                        target: "privacy",
                        title: "Privacy",
                        description: "Your data stays yours",
                        Icon: ShieldCheck,
                      },
                      {
                        target: "about",
                        title: "About",
                        description:
                          "Our purpose and the people behind the app",
                        Icon: CircleHelp,
                      },
                      {
                        target: "help",
                        title: "Help",
                        description: "A little guidance when you need it",
                        Icon: CircleHelp,
                      },
                    ] as const
                  ).map(({ target, title, description, Icon }) => (
                    <a
                      href={routeURL(target)}
                      key={target}
                      onClick={(e) => {
                        e.preventDefault();
                        go(target);
                      }}
                    >
                      <span className="menu-icon">
                        <Icon size={22} />
                      </span>
                      <span>
                        <strong>{t(title)}</strong>
                        <small>{t(description)}</small>
                      </span>
                      <ChevronRight size={18} />
                    </a>
                  ))}
                </div>
                <InstallCard installation={installation} t={t} />
                <section className="settings-card">
                  <h2>{t("Source code & contributions")}</h2>
                  <p>
                    {t(
                      "Everyone is welcome to contribute code, translations, feedback, and ideas.",
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
                </section>
              </section>
            )}
            {page === "about" && <About t={t} />}
            {page === "profile" && <Profile t={t} onNotice={setMessage} />}
            {page === "notfound" && (
              <section className="panel empty">
                <h1>{t("Page not found")}</h1>
                <p>
                  {t(
                    "This page or connection is not available on this device.",
                  )}
                </p>
                <button onClick={() => go("home")}>{t("Go home")}</button>
              </section>
            )}
            {page === "settings" && (
              <section className="panel prose settings-page">
                <div className="page-intro">
                  <h1>{t("Settings")}</h1>
                  <p>{t("Your app, your preferences.")}</p>
                </div>
                <div className="settings-card">
                  <h2>{t("Offline access")}</h2>
                  <p>
                    {online
                      ? "Your device is online."
                      : "Your device is offline."}{" "}
                    Download English and Myanmar together to scan without
                    internet.
                  </p>
                  <p>
                    <strong>
                      {t("Recognition languages")}:{" "}
                      {t("English + Myanmar (experimental)")}
                    </strong>
                  </p>
                  <p>{t("Coming later: Thai, Chinese, and Japanese.")}</p>
                  {!window.isSecureContext && (
                    <p role="alert">
                      {t(
                        "OCR download needs HTTPS or localhost. This HTTP Wi-Fi preview cannot prepare OCR. Use HTTPS on your phone, or localhost on this computer. You can still enter details manually.",
                      )}
                    </p>
                  )}
                  <button
                    className="primary"
                    disabled={preparing || !window.isSecureContext}
                    onClick={() => void prepare()}
                  >
                    <Download size={18} />
                    {preparing ? "Preparing…" : "Download for offline use"}
                  </button>
                  {preparing && <progress value={downloadProgress} max={1} />}
                  <p>{packInfo}</p>
                  <p role="status">{t(packStatus)}</p>
                  <p>
                    {t(
                      "Downloads come from this app\u2019s host. Myanmar OCR accuracy is experimental. Interface language does not change OCR recognition.",
                    )}
                  </p>
                </div>
                <div className="settings-card">
                  <h2>{t("Language")}</h2>
                  <label>
                    {t("Interface language")}
                    <select
                      value={language}
                      onChange={(e) => {
                        setLanguage(e.target.value);
                        try {
                          localStorage.setItem("starry-ui", e.target.value);
                        } catch {
                          /* session-only preference */
                        }
                      }}
                    >
                      <option value="en">English</option>
                      <option value="my">မြန်မာ</option>
                    </select>
                  </label>
                  <p>
                    {t(
                      "Use the language switch at the top. Myanmar translations are a draft and need human review. Some detailed instructions remain in English.",
                    )}
                  </p>
                </div>
                <div className="settings-card">
                  <h2>{t("Browser storage")}</h2>
                  <button
                    onClick={async () =>
                      setMessage(
                        (await navigator.storage?.persist?.())
                          ? "Persistent storage granted. Backups are still recommended."
                          : "Persistent storage was not granted or is unsupported. Export backups regularly.",
                      )
                    }
                  >
                    {t("Request persistent storage")}
                  </button>
                  <button
                    className="danger"
                    onClick={async () => {
                      if (
                        await confirmation.ask(
                          "Delete all saved cards and local app data? Exported or shared files will not be deleted.",
                        )
                      ) {
                        try {
                          await db.cards.clear();
                          setDraft(emptyContact());
                          setImages([]);
                          cancelOCR();
                          try {
                            localStorage.removeItem("starry-ui");
                            localStorage.removeItem(PROFILE_KEY);
                          } catch {
                            /* Storage may be restricted. */
                          }
                          const keys =
                            "caches" in window ? await caches.keys() : [];
                          await Promise.all(
                            keys
                              .filter((k) =>
                                k.startsWith(
                                  `starry-${new URL(import.meta.env.BASE_URL, location.href).href}`,
                                ),
                              )
                              .map((k) => caches.delete(k)),
                          );
                          await refresh();
                          setOffline(false);
                          setMessage("Local cards and cached assets deleted.");
                        } catch {
                          setMessage(
                            "Could not delete all local data. Please retry or use your browser’s site-data settings.",
                          );
                        }
                      }
                    }}
                  >
                    <Trash2 size={16} />
                    {t("Delete all local data")}
                  </button>
                </div>
              </section>
            )}
            {(page === "privacy" || page === "help") && (
              <section className="panel prose">
                <h1>
                  {page === "privacy"
                    ? "Your connections. Your privacy."
                    : "A little help getting started."}
                </h1>
                {page === "privacy" ? (
                  <>
                    <p>
                      {t(
                        "Your card photos and contact details stay on your device unless you choose to export or share them.",
                      )}
                    </p>
                    <h2>{t("Local from photo to contact")}</h2>
                    <p>
                      {t(
                        "OCR runs on your device. We do not use cloud OCR, accounts, analytics, advertising, tracking pixels, or telemetry. The hosting provider may keep ordinary access logs when the app and OCR assets are downloaded online.",
                      )}
                    </p>
                    <h2>{t("Your browser is not a permanent backup")}</h2>
                    <p>
                      {t(
                        "Cards are stored in IndexedDB in this browser. Clearing browser data, private browsing, storage eviction, or losing your device may remove them. Data and backups are not encrypted by this app. Same-origin application code can access stored data.",
                      )}
                    </p>
                    <h2>{t("You choose what leaves")}</h2>
                    <p>
                      {t(
                        "Contact downloads, QR codes, JSON backups, and sharing include the details you choose. Store exported files carefully. Deleting local data does not delete files you already exported or shared.",
                      )}
                    </p>
                  </>
                ) : (
                  <>
                    <h2>{t("1. Take a clear photo")}</h2>
                    <p>
                      {t(
                        "Keep all card text visible in even lighting. Add the back if it contains more details. Rotate or crop the photo before reading it.",
                      )}
                    </p>
                    <h2>{t("2. Check every detail")}</h2>
                    <p>
                      {t(
                        "OCR can make mistakes, especially on Myanmar and mixed-language cards. Names and job titles are not guessed. Enter uncertain fields manually. Full names are preserved without assuming Western name order.",
                      )}
                    </p>
                    <h2>{t("3. Save or export")}</h2>
                    <p>
                      {t(
                        "Save keeps a card in this browser only. Download a VCF and open it on your phone to import the contact. Your operating system controls the import.",
                      )}
                    </p>
                    <h2>{t("Prepare before going offline")}</h2>
                    <p>
                      {t(
                        "Open Settings and download the selected language pack while online. If an offline model is missing, use manual entry. Export a JSON backup regularly to restore your collection later.",
                      )}
                    </p>
                  </>
                )}
              </section>
            )}
          </>
        )}
      </main>
      <footer className="app-attribution">
        <span>
          {t("A free community project by")}{" "}
          <a href={STARRY_URL} target="_blank" rel="noreferrer">
            <strong>STARRY Solutions</strong>
          </a>
        </span>
      </footer>
      <AppNav page={page} go={go} t={t} />
      {confirmation.message && (
        <MessageDialog
          key={confirmation.id}
          labels={confirmation.labels}
          message={confirmation.message}
          onClose={() => confirmation.finish(true)}
          onDismiss={() => confirmation.finish(false)}
          t={t}
        />
      )}
      {message && (
        <MessageDialog message={message} onClose={() => setMessage("")} t={t} />
      )}
      {ocrDownload && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ocr-download-title"
            aria-describedby="ocr-download-description"
          >
            <h2 id="ocr-download-title">
              {t("Download OCR to read this card")}
            </h2>
            <p id="ocr-download-description">
              {t(
                "The selected recognition language is not downloaded yet. Download English and Myanmar together to read cards on this device. Your photo stays on your device.",
              )}
            </p>
            <p>
              {t("OCR recognition language")}:{" "}
              <strong>
                {t(
                  ocrLanguage === "eng"
                    ? "English"
                    : ocrLanguage === "mya"
                      ? "Myanmar (experimental)"
                      : "English + Myanmar (experimental)",
                )}
              </strong>
            </p>
            <p>
              {t(
                "English and Myanmar are included in the download (about 51 MB). Keep this screen open while it downloads.",
              )}
            </p>
            {!window.isSecureContext ? (
              <p role="alert">
                {t(
                  "OCR download needs HTTPS or localhost. This HTTP Wi-Fi preview cannot prepare OCR. Use HTTPS on your phone, or localhost on this computer. You can still enter details manually.",
                )}
              </p>
            ) : (
              !online && (
                <p role="alert">
                  {t(
                    "Connect to the internet to download the OCR files, then try again.",
                  )}
                </p>
              )
            )}
            {preparing && (
              <progress
                aria-label={t("OCR download progress")}
                value={downloadProgress}
                max={1}
              />
            )}
            {packStatus && <p role="status">{t(packStatus)}</p>}
            <div className="button-row">
              <button
                className="primary"
                disabled={preparing || !online || !window.isSecureContext}
                onClick={async () => {
                  if (await prepare()) {
                    setOcrDownload(false);
                    await read();
                  }
                }}
              >
                {t(preparing ? "Downloading…" : "Download and read")}
              </button>
              <button
                onClick={() => {
                  offlineTools.cancelPreparation();
                  setOcrDownload(false);
                }}
              >
                {t(preparing ? "Cancel download" : "Not now")}
              </button>
              <button
                disabled={preparing}
                onClick={() => {
                  setOcrDownload(false);
                  setPage("edit");
                }}
              >
                {t("Enter Details Manually")}
              </button>
            </div>
          </section>
        </div>
      )}
      {duplicates.length > 0 && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="duplicate-title"
          >
            <h2 id="duplicate-title">{t("A familiar connection?")}</h2>
            <p>
              {t(
                "A phone number or email matches an existing card. Nothing has been overwritten.",
              )}
            </p>
            {duplicates.map((c) => (
              <div key={c.id}>
                <strong>{c.name || c.company}</strong>
                <p>{c.emails.map((e) => e.value).join(", ")}</p>
                <button
                  onClick={() => {
                    setDuplicates([]);
                    edit(c);
                  }}
                >
                  {t("Review existing card")}
                </button>
                <button
                  onClick={async () => {
                    const merged = {
                      ...draft,
                      id: c.id,
                      createdAt: c.createdAt,
                    };
                    for (const key of [
                      "name",
                      "givenName",
                      "familyName",
                      "company",
                      "title",
                      "address",
                      "notes",
                    ] as const) {
                      if (c[key] && draft[key] && c[key] !== draft[key])
                        merged[key] = (await confirmation.ask(
                          `${key}: keep new value “${draft[key]}”? Cancel keeps “${c[key]}”.`,
                        ))
                          ? draft[key]
                          : c[key];
                      else merged[key] = draft[key] || c[key];
                    }
                    merged.phones = [
                      ...c.phones,
                      ...draft.phones.filter(
                        (p) => !c.phones.some((q) => q.value === p.value),
                      ),
                    ];
                    merged.emails = [
                      ...c.emails,
                      ...draft.emails.filter(
                        (p) => !c.emails.some((q) => q.value === p.value),
                      ),
                    ];
                    merged.websites = Array.from(
                      new Set([...c.websites, ...draft.websites]),
                    );
                    merged.rawText = [c.rawText, draft.rawText]
                      .filter(Boolean)
                      .join("\n");
                    setImages((prev) =>
                      Array.from(new Set([...(c.photos || []), ...prev])).slice(
                        0,
                        2,
                      ),
                    );
                    setRetain(retain || !!c.photos?.length);
                    setDraft(merged);
                    setDuplicates([]);
                    setMessage(
                      "Merged details are ready for review. Save to apply the merge.",
                    );
                  }}
                >
                  {t("Merge and review conflicts")}
                </button>
              </div>
            ))}
            <div className="button-row">
              <button className="primary" onClick={() => void save(true)}>
                {t("Save separately")}
              </button>
              <button onClick={() => setDuplicates([])}>{t("Cancel")}</button>
            </div>
          </section>
        </div>
      )}
      {imported && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="restore-title"
          >
            <h2 id="restore-title">Restore {imported.length} cards?</h2>
            <p>
              {t(
                "Existing cards remain. Possible duplicates will be reviewed before import.",
              )}
            </p>
            <ul>
              {imported.slice(0, 20).map((c) => (
                <li key={c.id}>{c.name || c.company || "Contact"}</li>
              ))}
            </ul>
            <div className="button-row">
              <button className="primary" onClick={() => void restore()}>
                {t("Restore cards")}
              </button>
              <button onClick={() => setImported(null)}>{t("Cancel")}</button>
            </div>
          </section>
        </div>
      )}
      {cropIndex !== null && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="crop-title"
          >
            <h2 id="crop-title">{t("Crop card")}</h2>
            <div className="crop-preview">
              <img src={images[cropIndex]} alt="Crop preview" />
              <div
                style={{
                  left: `${crop.x}%`,
                  top: `${crop.y}%`,
                  width: `${crop.w}%`,
                  height: `${crop.h}%`,
                }}
              />
            </div>
            {(["x", "y", "w", "h"] as const).map((k) => (
              <label key={k}>
                {{ x: "Left", y: "Top", w: "Width", h: "Height" }[k]} (%)
                <input
                  type="range"
                  min={k === "w" || k === "h" ? 10 : 0}
                  max={
                    k === "x"
                      ? 100 - crop.w
                      : k === "y"
                        ? 100 - crop.h
                        : k === "w"
                          ? 100 - crop.x
                          : 100 - crop.y
                  }
                  value={crop[k]}
                  onChange={(e) =>
                    setCrop((v) => ({ ...v, [k]: Number(e.target.value) }))
                  }
                />
              </label>
            ))}
            <div className="button-row">
              <button
                className="primary"
                onClick={async () => {
                  const next = await transformImage(
                    images[cropIndex],
                    false,
                    crop,
                  );
                  setImages((v) =>
                    v.map((s, i) => (i === cropIndex ? next : s)),
                  );
                  setCropIndex(null);
                }}
              >
                {t("Apply crop")}
              </button>
              <button onClick={() => setCropIndex(null)}>{t("Cancel")}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
