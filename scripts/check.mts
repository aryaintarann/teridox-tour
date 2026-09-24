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
