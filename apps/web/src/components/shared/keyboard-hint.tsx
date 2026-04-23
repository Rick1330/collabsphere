interface KeyboardHintProps {
  keys: string[];
  label?: string;
}

export const KeyboardHint = ({ keys, label }: KeyboardHintProps) => (
  <div className="flex items-center gap-1.5">
    <div className="flex gap-0.5">
      {keys.map((key) => (
        <kbd
          key={key}
          className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded
            bg-white border border-stone-200 border-b-2 border-b-stone-300
            font-mono text-[10px] text-stone-500 shadow-sm"
        >
          {key}
        </kbd>
      ))}
    </div>
    {label && <span className="text-[11px] text-stone-400">{label}</span>}
  </div>
);
