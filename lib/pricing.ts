// Mirrors create_booking() in supabase/migrations/0002_design_prototype.sql. Change both together.
export const SERVICE_FEE = 250_000;
export const TAX_RATE = 0.11;

export function priceBreakdown(pricePerPerson: number, pax: number) {
  const subtotal = pricePerPerson * pax;
  const tax = Math.round(subtotal * TAX_RATE);
  return { subtotal, fee: SERVICE_FEE, tax, total: subtotal + SERVICE_FEE + tax };
}
