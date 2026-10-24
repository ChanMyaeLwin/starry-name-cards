import { useEffect, useRef } from "react";
export default function MessageDialog({
  message,
  onClose,
  t,
}: {
  message: string;
  onClose: () => void;
  t: (text: string) => string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (message && dialog && !dialog.open) dialog.showModal();
  }, [message]);
  const close = () => {
    ref.current?.close();
    onClose();
  };
  return (
    <dialog
      ref={ref}
      className="modal message-dialog"
      role="alertdialog"
      aria-labelledby="message-title"
      aria-describedby="message-body"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <h2 id="message-title">{t("Notice")}</h2>
      <p id="message-body">{t(message)}</p>
      <button className="primary" onClick={close}>
        {t("OK")}
      </button>
    </dialog>
  );
}
