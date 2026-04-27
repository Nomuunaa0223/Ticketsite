import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

export function Input({ label, hint, className = "", ...props }: Props) {
  return (
    <label className="flex flex-col gap-2 text-sm text-white/85">
      <span className="font-medium">{label}</span>
      <input
        {...props}
        className={`rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-0 transition placeholder:text-white/35 focus:border-white/30 ${className}`.trim()}
      />
      {hint ? <span className="text-xs text-white/45">{hint}</span> : null}
    </label>
  );
}
