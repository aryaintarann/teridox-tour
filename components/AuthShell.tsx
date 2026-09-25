export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-center px-4 pb-[100px] pt-20">
      <div className="w-full max-w-[440px]">
        <h1 className="display text-center text-[36px] tracking-[-0.8px]">{title}</h1>
        <div className="card mt-7 p-8">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input className="input" {...props} />
    </label>
  );
}
