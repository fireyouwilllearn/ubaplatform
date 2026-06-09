import { useCallback, useRef, useState, type ReactNode } from 'react';

export function Tooltip({ label, explain, children }: { label: string; explain: string; children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(true), 120);
  }, []);

  const hide = useCallback(() => {
    clearTimeout(timer.current);
    setVisible(false);
  }, []);

  return (
    <span
      className="group/tip relative inline-flex items-center gap-1"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      <span
        role="tooltip"
        aria-hidden={!visible}
        className={`pointer-events-none absolute bottom-full left-1/2 z-[100] -translate-x-1/2 rounded-xl border border-[var(--app-border)] bg-[var(--navy4)] px-3.5 py-2.5 text-left text-xs leading-relaxed text-[var(--text2)] shadow-lg transition-opacity duration-150 ${
          visible ? 'opacity-100' : 'opacity-0'
        } mb-2 w-64 max-w-[85vw]`}
      >
        <span className="block font-bold text-[var(--text)]">{label}</span>
        <span className="mt-1 block">{explain}</span>
      </span>
    </span>
  );
}
