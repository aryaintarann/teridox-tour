export function Stepper({ step, labels }: { step: 1 | 2 | 3; labels: [string, string, string] }) {
  return (
    <ol className="no-print flex flex-wrap items-center gap-3 text-[13.5px] text-faint">
      {labels.map((l, i) => (
        <li key={l} className="flex items-center gap-3">
          {i > 0 && <span aria-hidden className="h-px w-5 bg-line-2" />}
          <span className={i + 1 === step ? "font-bold text-accent" : ""} aria-current={i + 1 === step ? "step" : undefined}>
            {i + 1} {l}
          </span>
        </li>
      ))}
    </ol>
  );
}
