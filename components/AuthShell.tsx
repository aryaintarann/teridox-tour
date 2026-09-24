export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">{title}</h1>
      {children}
    </div>
  );
}

export function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="grid gap-2">
      <span className="label">{label}</span>
      <input className="input" {...props} />
    </label>
  );
}
