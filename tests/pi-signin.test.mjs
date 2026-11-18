import test from "node:test";
import assert from "node:assert/strict";
import { parsePiOAuthFragment } from "../src/lib/piOAuth.ts";

test("accepts a bearer token only when state matches", () => {
  const result = parsePiOAuthFragment(
    "#access_token=short-lived-token&token_type=Bearer&expires_in=3600&state=expected",
    "expected",
  );
  assert.deepEqual(result, { ok: true, accessToken: "short-lived-token", expiresIn: 3600 });
});

test("rejects missing or mismatched state", () => {
  assert.equal(parsePiOAuthFragment("#access_token=x&token_type=Bearer&state=wrong", "expected").ok, false);
  assert.equal(parsePiOAuthFragment("#access_token=x&token_type=Bearer&state=expected", null).ok, false);
});

test("maps provider cancellation and denial to safe errors", () => {
  assert.match(parsePiOAuthFragment("#error=access_denied&state=s", "s").error, /declined/i);
  assert.match(parsePiOAuthFragment("#error=cancelled&state=s", "s").error, /cancelled/i);
});

test("rejects missing access token and non-bearer token type", () => {
  assert.equal(parsePiOAuthFragment("#token_type=Bearer&state=s", "s").ok, false);
  assert.equal(parsePiOAuthFragment("#access_token=x&token_type=Basic&state=s", "s").ok, false);
});

test("does not trust malformed expiry values", () => {
  assert.deepEqual(
    parsePiOAuthFragment("#access_token=x&token_type=Bearer&expires_in=bad&state=s", "s"),
    { ok: true, accessToken: "x", expiresIn: null },
  );
});
