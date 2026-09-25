// DOKU Checkout (non-SNAP). Signature spec:
// https://developers.doku.com/get-started-with-doku-api/signature-component/non-snap
import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";

type SignInput = { clientId: string; requestId: string; timestamp: string; target: string; body: string; secret: string };

export function sign({ clientId, requestId, timestamp, target, body, secret }: SignInput) {
  const digest = createHash("sha256").update(body).digest("base64");
  const component =
    `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\n` +
    `Request-Target:${target}\nDigest:${digest}`;
  return "HMACSHA256=" + createHmac("sha256", secret).update(component).digest("base64");
}

export function verify(headers: Headers, rawBody: string, target: string, secret: string) {
  const got = headers.get("signature") ?? "";
  const expected = sign({
    clientId: headers.get("client-id") ?? "",
    requestId: headers.get("request-id") ?? "",
    timestamp: headers.get("request-timestamp") ?? "",
    target,
    body: rawBody,
    secret,
  });
  const a = Buffer.from(got), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Checkout method codes, per https://developers.doku.com/accept-payments/doku-checkout/checkout-settings
export const PAY_METHODS = {
  card: { CREDIT_CARD: "Card" },
  va: { VIRTUAL_ACCOUNT_BCA: "BCA", VIRTUAL_ACCOUNT_BANK_MANDIRI: "Mandiri", VIRTUAL_ACCOUNT_BNI: "BNI", VIRTUAL_ACCOUNT_BRI: "BRI" },
  ewallet: { EMONEY_OVO: "OVO", EMONEY_SHOPEE_PAY: "ShopeePay" },
  qris: { QRIS: "QRIS" },
} as const;
export type PayGroup = keyof typeof PAY_METHODS;

// DOKU channel id -> short label ("VIRTUAL_ACCOUNT_BCA" -> "VA BCA").
export function methodLabel(code: string | null | undefined) {
  if (!code) return "-";
  for (const [group, codes] of Object.entries(PAY_METHODS)) {
    const label = (codes as Record<string, string>)[code];
    if (label) return group === "va" ? `VA ${label}` : label;
  }
  return code.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

type CheckoutInput = {
  invoice: string;
  methodTypes?: string[];
  amount: number;
  callbackUrl: string;
  customer: { id: string; name: string; email: string; phone: string };
};

export async function createCheckout({ invoice, amount, callbackUrl, customer, methodTypes }: CheckoutInput) {
  const clientId = process.env.DOKU_CLIENT_ID, secret = process.env.DOKU_SECRET_KEY;
  if (!clientId || !secret) throw new Error("DOKU is not configured");

  const target = "/checkout/v1/payment";
  const requestId = randomUUID();
  const timestamp = new Date().toISOString().slice(0, 19) + "Z";
  const body = JSON.stringify({
    order: { amount, invoice_number: invoice, currency: "IDR", callback_url: callbackUrl },
    payment: { payment_due_date: 60, ...(methodTypes?.length && { payment_method_types: methodTypes }) },
    customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone.replace(/\D/g, "") },
  });

  const res = await fetch((process.env.DOKU_BASE_URL ?? "https://api-sandbox.doku.com") + target, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Id": clientId,
      "Request-Id": requestId,
      "Request-Timestamp": timestamp,
      Signature: sign({ clientId, requestId, timestamp, target, body, secret }),
    },
    body,
  });
  const json = await res.json().catch(() => ({}));
  const url: string | undefined = json?.response?.payment?.url;
  if (!res.ok || !url) throw new Error(`DOKU checkout failed: ${res.status} ${JSON.stringify(json)}`);
  return { requestId, url };
}
