import { useCallback, useEffect, useRef, useState } from "react";
export type ConfirmationLabels = {
  title?: string;
  confirm?: string;
  cancel?: string;
};
export function useConfirmation() {
  const [labels, setLabels] = useState<ConfirmationLabels>({});
  const [message, setMessage] = useState("");
  const [id, setId] = useState(0);
  const pending = useRef<((accepted: boolean) => void) | null>(null);
  const ask = useCallback((text: string, options: ConfirmationLabels = {}) => {
    if (pending.current) return Promise.resolve(false);
    setLabels(options);
    setId((value) => value + 1);
    setMessage(text);
    return new Promise<boolean>((resolve) => {
      pending.current = resolve;
    });
  }, []);
  const finish = useCallback((accepted: boolean) => {
    const resolve = pending.current;
    pending.current = null;
    setMessage("");
    resolve?.(accepted);
  }, []);
  useEffect(
    () => () => {
      pending.current?.(false);
      pending.current = null;
    },
    [],
  );
  return { id, message, labels, ask, finish };
}
