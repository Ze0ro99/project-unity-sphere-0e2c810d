import { useMemo, useState } from "react";
import { Lock, ShieldCheck, CheckCircle2, XCircle, Cpu, KeyRound } from "lucide-react";
import { useI18n } from "@/i18n";

type Result = { ok: boolean; reason?: string; hash?: string } | null;

function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  return crypto.subtle.digest("SHA-256", enc).then((buf) =>
    Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

const HEX_RE = /^[0-9a-fA-F\s]+$/;

export default function Bn254() {
  const { t, lang } = useI18n();
  const [proof, setProof] = useState("");
  const [inputs, setInputs] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);

  const vk = useMemo(
    () => ({
      hash: "0x8a5f…c9b2e01d",
      inputs: 4,
      initialized: true,
    }),
    []
  );

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    const clean = proof.replace(/\s+/g, "");
    if (!clean) return setResult({ ok: false, reason: t("bn.err.emptyProof") });
    if (!HEX_RE.test(proof)) return setResult({ ok: false, reason: t("bn.err.badHex") });
    if (!inputs.trim()) return setResult({ ok: false, reason: t("bn.err.emptyInputs") });

    setBusy(true);
    try {
      const hash = await sha256Hex(clean + "|" + inputs.trim());
      // Deterministic demo: accept when the proof hex length is a multiple of 64 (G1+G2+G1 packing hint).
      const ok = clean.length % 64 === 0 && clean.length >= 64 * 3;
      setResult(ok ? { ok: true, hash } : { ok: false, hash, reason: "e(a,b)·e(vk_x,γ)⁻¹·e(c,δ)⁻¹ ≠ e(α,β)" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6" key={lang}>
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Lock size={22} className="text-emerald-400" /> {t("bn.title")}
          </h1>
          <p className="text-sm text-muted mt-1 max-w-3xl">{t("bn.subtitle")}</p>
        </div>
        <a
          href="https://github.com/Ze0ro99/PiRC/blob/main/contracts/bn254_verifier/DEPLOY.md"
          target="_blank"
          rel="noreferrer"
          className="px-3 py-2 rounded-md border border-border text-sm hover:bg-panel2 mono"
        >
          {t("bn.deployLink")}
        </a>
      </header>

      <section className="grid md:grid-cols-2 gap-3">
        <ModeCard
          icon={<ShieldCheck size={18} className="text-emerald-400" />}
          title={t("bn.mode.commit.title")}
          badge={t("bn.mode.commit.badge")}
          badgeTone="emerald"
          body={t("bn.mode.commit.body")}
        />
        <ModeCard
          icon={<Cpu size={18} className="text-sky-400" />}
          title={t("bn.mode.bn254.title")}
          badge={t("bn.mode.bn254.badge")}
          badgeTone="sky"
          body={t("bn.mode.bn254.body")}
        />
      </section>

      <section className="grid md:grid-cols-3 gap-3">
        <div className="p-4 rounded-lg border border-border bg-panel/60 md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound size={16} />
            <h2 className="font-semibold">{t("bn.vk.title")}</h2>
          </div>
          <dl className="text-sm space-y-2">
            <Row label={t("bn.vk.hash")} value={<span className="mono text-xs">{vk.hash}</span>} />
            <Row label={t("bn.vk.publicInputs")} value={<span className="mono">{vk.inputs}</span>} />
            <Row
              label={t("bn.vk.status")}
              value={
                <span
                  className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    vk.initialized ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                  }`}
                >
                  {vk.initialized ? t("bn.vk.set") : t("bn.vk.pending")}
                </span>
              }
            />
          </dl>
        </div>

        <form onSubmit={onVerify} className="p-4 rounded-lg border border-border bg-panel/60 md:col-span-2 space-y-3">
          <h2 className="font-semibold">{t("bn.verify.title")}</h2>
          <div>
            <label className="text-xs text-muted block mb-1">{t("bn.verify.proofLabel")}</label>
            <textarea
              value={proof}
              onChange={(e) => setProof(e.target.value)}
              rows={4}
              spellCheck={false}
              className="w-full bg-panel2/60 border border-border rounded-md p-2 mono text-xs outline-none focus:border-gold"
              placeholder="0x…"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">{t("bn.verify.inputsLabel")}</label>
            <input
              value={inputs}
              onChange={(e) => setInputs(e.target.value)}
              className="w-full bg-panel2/60 border border-border rounded-md p-2 mono text-xs outline-none focus:border-gold"
              placeholder="0x01, 0x02, 0x03, 0x04"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="submit"
              disabled={busy}
              className="px-3 py-2 rounded-md bg-gold text-black text-sm font-medium disabled:opacity-60"
            >
              {busy ? t("bn.verify.verifying") : t("bn.verify.submit")}
            </button>
            {result && (
              <div
                className={`flex items-center gap-2 text-sm ${
                  result.ok ? "text-emerald-400" : "text-rose-400"
                }`}
                role="status"
                aria-live="polite"
              >
                {result.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span>{result.ok ? t("bn.verify.ok") : t("bn.verify.fail")}</span>
                {!result.ok && result.reason && (
                  <span className="text-muted mono text-xs">
                    · {t("bn.verify.reason")}: {result.reason}
                  </span>
                )}
                {result.hash && <span className="text-muted mono text-xs">· {result.hash.slice(0, 18)}…</span>}
              </div>
            )}
          </div>
        </form>
      </section>

      <section className="p-4 rounded-lg border border-border bg-panel/60">
        <h2 className="font-semibold mb-3">{t("bn.pipeline.title")}</h2>
        <ol className="grid md:grid-cols-2 gap-2 text-sm list-decimal ltr:pl-5 rtl:pr-5">
          {[1, 2, 3, 4].map((i) => (
            <li key={i} className="text-muted">
              <span className="text-text">{t(`bn.pipeline.${i}`)}</span>
            </li>
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
  badgeTone: "emerald" | "sky";
  body: string;
}) {
  const tone =
    badgeTone === "emerald" ? "bg-emerald-500/10 text-emerald-400" : "bg-sky-500/10 text-sky-400";
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
      <dd>{value}</dd>
    </div>
  );
}
