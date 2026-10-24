import { useEffect, useId, useRef } from "react";
export default function MessageDialog({
  message,
  onClose,
  t,
  onDismiss,
}: {
  message: string;
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
      <h2 id={`${id}-title`}>{t(onDismiss ? "Please confirm" : "Notice")}</h2>
      <p id={`${id}-body`}>{t(message)}</p>
      <div className="button-row">
        {onDismiss && (
          <button onClick={() => close(false)}>{t("Cancel")}</button>
        )}
        <button className="primary" onClick={() => close()}>
          {t(onDismiss ? "Confirm" : "OK")}
        </button>
      </div>
    </dialog>
  );
}
