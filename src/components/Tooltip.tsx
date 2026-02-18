export function Tooltip({ text }: { text: string }) {
  return (
    <span className="relative group inline-flex" tabIndex={0}>
      <span className="w-4 h-4 rounded-full border border-preik-border bg-preik-bg text-preik-text-muted text-[10px] font-semibold inline-flex items-center justify-center cursor-help select-none shrink-0">
        ?
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 rounded-lg bg-preik-text text-preik-bg text-xs leading-relaxed shadow-lg opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-50"
      >
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-preik-text" />
      </span>
    </span>
  );
}
