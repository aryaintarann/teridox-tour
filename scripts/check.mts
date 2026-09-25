// Run: pnpm check. Guards the DOKU signature logic that the webhook's trust depends on.
import assert from "node:assert/strict";
import { sign, verify } from "../lib/doku.ts";

const secret = "SK-test";
const body = JSON.stringify({ order: { invoice_number: "TDX-1", amount: 850000 }, transaction: { status: "SUCCESS" } });
const h = { clientId: "BRN-1", requestId: "req-1", timestamp: "2026-09-24T01:00:00Z", target: "/api/webhooks/doku" };
const headers = new Headers({
  "Client-Id": h.clientId, "Request-Id": h.requestId, "Request-Timestamp": h.timestamp,
  Signature: sign({ ...h, body, secret }),
});

assert.match(headers.get("signature")!, /^HMACSHA256=[A-Za-z0-9+/]+=*$/);
assert.equal(verify(headers, body, h.target, secret), true, "valid signature accepted");
assert.equal(verify(headers, body.replace("850000", "1"), h.target, secret), false, "tampered body rejected");
assert.equal(verify(headers, body, "/other", secret), false, "wrong target rejected");
assert.equal(verify(headers, body, h.target, "wrong"), false, "wrong secret rejected");
headers.delete("signature");
assert.equal(verify(headers, body, h.target, secret), false, "missing signature rejected");
console.log("doku signature: ok");

import { priceBreakdown } from "../lib/pricing.ts";
// Same numbers the SQL in create_booking() must produce.
assert.deepEqual(priceBreakdown(18_500_000, 2), { subtotal: 37_000_000, fee: 250_000, tax: 4_070_000, total: 41_320_000 });
assert.deepEqual(priceBreakdown(3_450_000, 3), { subtotal: 10_350_000, fee: 250_000, tax: 1_138_500, total: 11_738_500 });
console.log("pricing: ok");
