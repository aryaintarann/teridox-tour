import { ActionForm } from "@/components/ActionForm";
import { AuthShell, Field } from "@/components/AuthShell";
import { SubmitButton } from "@/components/SubmitButton";
import { adminLogin } from "../actions";

export const metadata = { title: "Admin Login" };

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "" } = await searchParams;
  return (
    <div className="pt-10">
      <p className="text-center text-lg font-bold">Teridox<span className="text-accent">Tour</span> Admin</p>
      <AuthShell title="Masuk admin">
        <ActionForm action={adminLogin}>
          <input type="hidden" name="next" value={next} />
          <Field label="Email" name="email" type="email" autoComplete="email" required />
          <Field label="Password" name="password" type="password" autoComplete="current-password" required />
          <SubmitButton>Masuk</SubmitButton>
        </ActionForm>
      </AuthShell>
    </div>
  );
}
