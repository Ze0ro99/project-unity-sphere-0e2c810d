// Full Stellar/Pi strkey validation: base32 decode + version byte + CRC16-XModem checksum.
// Used to verify PiRC registry keys imported from the Ze0ro99/PiRC monorepo.

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

const VERSION_BYTES: Record<string, number> = {
  ed25519PublicKey: 6 << 3, // G (48)
  ed25519SecretSeed: 18 << 3, // S
  preAuthTx: 19 << 3, // T
  sha256Hash: 23 << 3, // X
  muxedAccount: 12 << 3, // M
  contract: 2 << 3, // C (16)
};

function base32Decode(input: string): Uint8Array | null {
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of input) {
    const idx = ALPHABET.indexOf(ch);
    if (idx === -1) return null;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

function crc16xmodem(data: Uint8Array): number {
  let crc = 0x0000;
  for (const b of data) {
    let code = (crc >>> 8) & 0xff;
    code ^= b & 0xff;
    code ^= code >>> 4;
    crc = ((crc << 8) & 0xffff) ^ ((code << 12) & 0xffff) ^ ((code << 5) & 0xffff) ^ code;
  }
  return crc & 0xffff;
}

export type StrKeyKind = keyof typeof VERSION_BYTES;

export type StrKeyCheck = {
  valid: boolean;
  kind: StrKeyKind | null;
  reason: string;
};

/** Verify a strkey fully (length, alphabet, version byte, CRC16 checksum). */
export function verifyStrKey(key: string, expected?: StrKeyKind): StrKeyCheck {
  const fail = (reason: string): StrKeyCheck => ({ valid: false, kind: null, reason });
  if (!key) return fail("empty");
  if (key !== key.toUpperCase()) return fail("must be uppercase");
  if (key.length !== 56) return fail(`length ${key.length}, expected 56`);
  for (const ch of key) {
    if (ALPHABET.indexOf(ch) === -1) return fail(`invalid base32 character "${ch}"`);
  }
  const raw = base32Decode(key);
  if (!raw || raw.length !== 35) return fail("decode failed");

  const version = raw[0];
  const kind = (Object.keys(VERSION_BYTES) as StrKeyKind[]).find((k) => VERSION_BYTES[k] === version);
  if (!kind) return fail(`unknown version byte 0x${version.toString(16)}`);

  const payload = raw.slice(0, 33);
  const checksum = raw[33] | (raw[34] << 8);
  if (crc16xmodem(payload) !== checksum) return fail("checksum mismatch");

  if (expected && kind !== expected) return { valid: false, kind, reason: `is ${kind}, expected ${expected}` };
  return { valid: true, kind, reason: "verified" };
}

export const isAccountKey = (k: string) => verifyStrKey(k, "ed25519PublicKey").valid;
export const isContractKey = (k: string) => verifyStrKey(k, "contract").valid;
