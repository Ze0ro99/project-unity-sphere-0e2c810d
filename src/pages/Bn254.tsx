import { useState } from "react";
import { Lock, ShieldCheck, Cpu, Hash } from "lucide-react";
import { useI18n } from "@/i18n";

type Result = { hash: string } | { error: string } | null;

function parseHexBytes(value: string): Uint8Array {
  const clean = value.replace(/^0x/i, "").replace(/\s+/g, "");
  if (!clean || clean.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(clean)) {
    throw new Error("Enter non-empty, even-length hexadecimal bytes.");
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function encodeU32(value: number): Uint8Array {
  if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) {
    throw new Error("Input is too large for the commitment encoding.");
  }
  return new Uint8Array([(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255]);
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

async function sha256HexBytes(input: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new Uint8Array(input));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Computes the same domain-separated commitment encoding as the Soroban
 * reference contract. This is a local preview only; it does not verify a proof.
 */
export default function Bn254() {
  const { t, lang } = useI18n();
  const [proof, setProof] = useState("");
  const [inputs, setInputs] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);

  async function onPreview(event: React.FormEvent) {
    event.preventDefault();
    setResult(null);
    setBusy(true);
    try {
      const proofBytes = parseHexBytes(proof);
      const inputBytes = inputs.split(",").map((part) => parseHexBytes(part.trim()));
      if (inputBytes.length === 0) throw new Error("At least one public input is required.");
      const domain = new TextEncoder().encode("PiRC-800:COMMITMENT:v1");
      const parts: Uint8Array[] = [domain, encodeU32(proofBytes.length), proofBytes];
      for (const input of inputBytes) parts.push(encodeU32(input.length), input);
      const hash = await sha256HexBytes(concatBytes(parts));
      setResult({ hash });
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : "Unable to compute commitment preview." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Lock size={22} className="text-amber-400" /> {t("bn.title")}
          </h1>
          <p className="text-sm text-muted mt-1 max-w-3xl">{t("bn.subtitle")}</p>
        </div>
        <a
          href="https://github.com/Ze0ro99/project-unity-sphere-0e2c810d/blob/integration/sovereign-hybrid-ecosystem/contracts/bn254_verifier/DEPLOY.md"
          target="_blank"
          rel="noreferrer"
          className="px-3 py-2 rounded-md border border-border text-sm hover:bg-panel2 mono"
        >
          {t("bn.deployLink")}
        </a>
      </header>

      <section className="grid md:grid-cols-2 gap-3">
        <ModeCard
          icon={<ShieldCheck size={18} className="text-amber-400" />}
          title={t("bn.mode.commit.title")}
          badge={t("bn.mode.commit.badge")}
          badgeTone="amber"
          body={t("bn.mode.commit.body")}
        />
        <ModeCard
          icon={<Cpu size={18} className="text-rose-400" />}
          title={t("bn.mode.bn254.title")}
          badge={t("bn.mode.bn254.badge")}
          badgeTone="rose"
          body={t("bn.mode.bn254.body")}
        />
      </section>

      <section className="grid md:grid-cols-3 gap-3">
        <div className="p-4 rounded-lg border border-border bg-panel/60 md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <Lock size={16} />
            <h2 className="font-semibold">{t("bn.deployment.title")}</h2>
          </div>
          <dl className="text-sm space-y-2">
            <Row label={t("bn.deployment.status")} value={<span className="text-amber-400 text-xs uppercase">{t("common.status.unverified")}</span>} />
            <Row label={t("bn.deployment.value")} value={<span className="text-xs text-muted">{t("bn.deployment.notice")}</span>} />
          </dl>
        </div>

        <form onSubmit={onPreview} className="p-4 rounded-lg border border-border bg-panel/60 md:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <Hash size={16} />
            <h2 className="font-semibold">{t("bn.preview.title")}</h2>
          </div>
          <p className="text-xs text-amber-400">{t("bn.preview.notice")}</p>
          <div>
            <label className="text-xs text-muted block mb-1">{t("bn.preview.proofLabel")}</label>
            <textarea
              value={proof}
              onChange={(event) => setProof(event.target.value)}
              rows={3}
              spellCheck={false}
              className="w-full bg-panel2/60 border border-border rounded-md p-2 mono text-xs outline-none focus:border-gold"
              placeholder="0x..."
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">{t("bn.preview.inputsLabel")}</label>
            <input
              value={inputs}
              onChange={(event) => setInputs(event.target.value)}
              className="w-full bg-panel2/60 border border-border rounded-md p-2 mono text-xs outline-none focus:border-gold"
              placeholder="0x01, 0x02, 0x03"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="submit"
              disabled={busy}
              className="px-3 py-2 rounded-md bg-gold text-black text-sm font-medium disabled:opacity-60"
            >
              {busy ? t("bn.preview.computing") : t("bn.preview.compute")}
            </button>
            {result && (
              <div className="text-sm min-w-0" role="status" aria-live="polite">
                {"error" in result ? (
                  <span className="text-rose-400">{result.error}</span>
                ) : (
                  <div className="space-y-1">
                    <span className="text-amber-400 block">{t("bn.preview.hashLabel")}</span>
                    <code className="text-xs mono break-all text-muted">{result.hash}</code>
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
      </section>

      <section className="p-4 rounded-lg border border-border bg-panel/60">
        <h2 className="font-semibold mb-3">{t("bn.pipeline.title")}</h2>
        <ol className="grid md:grid-cols-2 gap-2 text-sm list-decimal ltr:pl-5 rtl:pr-5">
          {[1, 2, 3, 4].map((i) => (
            <li key={i} className="text-muted"><span className="text-text">{t(`bn.pipeline.${i}`)}</span></li>
          ))}
        </ol>
      </section>

      <section className="p-4 rounded-lg border border-border bg-panel/60">
        <h2 className="font-semibold mb-2">{t("bn.compliance.title")}</h2>
        <p className="text-sm text-muted">{t("bn.compliance.body")}</p>
      </section>
    </div>
  );
}

function ModeCard({
  icon,
  title,
  badge,
  badgeTone,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  badge: string;
  badgeTone: "amber" | "rose";
  body: string;
}) {
  const tone = badgeTone === "amber"
    ? "bg-amber-500/10 text-amber-400"
    : "bg-rose-500/10 text-rose-400";
  return (
    <div className="p-4 rounded-lg border border-border bg-panel/60">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-panel2 flex items-center justify-center">{icon}</div>
        <div className="flex-1">
          <div className="font-medium">{title}</div>
          <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${tone}`}>{badge}</span>
        </div>
      </div>
      <p className="text-sm text-muted mt-2">{body}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted text-xs">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
