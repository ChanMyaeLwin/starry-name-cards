import BrandIcon from "./BrandIcon";
import { useEffect, useId, useRef } from "react";
export default function MessageDialog({
  message,
  onClose,
  t,
  onDismiss,
  labels = {},
}: {
  message: string;
  labels?: { title?: string; confirm?: string; cancel?: string };
  onDismiss?: () => void;
  onClose: () => void;
  t: (text: string) => string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (message && dialog && !dialog.open) dialog.showModal();
  }, [message]);
  const close = (accept = true) => {
    ref.current?.close();
    if (!accept && onDismiss) onDismiss();
    else onClose();
  };
  return (
    <dialog
      ref={ref}
      className="modal message-dialog"
      role={onDismiss ? "dialog" : "alertdialog"}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-body`}
      onCancel={(event) => {
        event.preventDefault();
        close(false);
      }}
    >
      <div className="popup-heading">
        <BrandIcon size={44} />
        <h2 id={`${id}-title`}>
          {t(labels.title || (onDismiss ? "Please confirm" : "Notice"))}
        </h2>
      </div>
      <p id={`${id}-body`}>{t(message)}</p>
      <div className="button-row">
        {onDismiss && (
          <button onClick={() => close(false)}>
            {t(labels.cancel || "Cancel")}
          </button>
        )}
        <button className="primary" onClick={() => close()}>
          {t(labels.confirm || (onDismiss ? "Confirm" : "OK"))}
        </button>
      </div>
    </dialog>
  );
}
