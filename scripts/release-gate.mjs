#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const failures = [];
const manifest = JSON.parse(await readFile(new URL("../configs/pirc-integration-manifest.json", import.meta.url), "utf8"));
const messages = await readFile(new URL("../src/i18n/messages.ts", import.meta.url), "utf8");
const i18nProvider = await readFile(new URL("../src/i18n/index.tsx", import.meta.url), "utf8");
const locales = ["en", "ar", "zh", "id", "fr", "es", "de", "pt"];
const dictionaries = new Map();

function parseDictionary(locale) {
  const start = messages.indexOf(`const ${locale}: Dict = {`);
  if (start < 0) return null;
  const end = messages.indexOf("\n};", start);
  if (end < 0) return null;
  const block = messages.slice(start, end);
  const entries = new Map();
  for (const match of block.matchAll(/^\s*"([^"]+)"\s*:\s*(?:"([^"\n]*)"|[\r\n]+\s*"([^"\n]*)")/gm)) {
    if (entries.has(match[1])) failures.push(`Locale ${locale} contains duplicate key: ${match[1]}`);
    entries.set(match[1], match[2] ?? match[3] ?? "");
  }
  return entries;
}

for (const locale of locales) {
  const dictionary = parseDictionary(locale);
  if (!dictionary) failures.push(`Missing or malformed locale dictionary: ${locale}`);
  else dictionaries.set(locale, dictionary);
}

const english = dictionaries.get("en") ?? new Map();
const placeholders = (value) => [...value.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((match) => match[1]).sort().join("|");
const supportedMatch = i18nProvider.match(/const SUPPORTED = new Set<string>\(\[([^\]]*)\]\)/);
if (!supportedMatch) failures.push("The shared i18n provider does not expose a parseable supported-locale allowlist.");
const enabledLocales = supportedMatch ? [...supportedMatch[1].matchAll(/"([a-z]{2})"/g)].map((match) => match[1]) : [];
if (!enabledLocales.includes("en")) failures.push("English must remain enabled as the fallback locale.");
for (const locale of enabledLocales) {
  const dictionary = dictionaries.get(locale);
  if (!dictionary) {
    failures.push(`Enabled locale ${locale} has no dictionary.`);
    continue;
  }
  const missing = [...english.keys()].filter((key) => !dictionary.has(key));
  const empty = [...dictionary].filter(([, value]) => !value.trim()).map(([key]) => key);
  const mismatched = [...english.keys()].filter((key) => dictionary.has(key) && placeholders(english.get(key)) !== placeholders(dictionary.get(key)));
  if (missing.length) failures.push(`Enabled locale ${locale} is missing ${missing.length}/${english.size} English baseline keys.`);
  if (empty.length) failures.push(`Enabled locale ${locale} has ${empty.length} empty translation values.`);
  if (mismatched.length) failures.push(`Enabled locale ${locale} has ${mismatched.length} interpolation-placeholder mismatches.`);
}
for (const locale of locales.filter((item) => !enabledLocales.includes(item))) {
  console.log(`Locale ${locale}: disabled until its complete translation review is finished.`);
}
const switcherLocales = [...i18nProvider.matchAll(/\{ code: "([a-z]{2})", label: "[^"]+", complete: (true|false) \}/g)];
for (const [, locale, complete] of switcherLocales) {
  if ((complete === "true") !== enabledLocales.includes(locale)) {
    failures.push(`Language switcher completion flag disagrees with provider allowlist for ${locale}.`);
  }
}

const network = manifest.target_network ?? {};
if (network.network_id !== "pi-testnet1" || network.canonical_network !== "Pi Testnet") failures.push("The release target must be the explicitly named Pi Testnet profile.");
if (network.mainnet_writes_enabled !== false) failures.push("Mainnet writes must remain disabled in the release manifest.");
const probe = network.last_read_only_probe ?? {};
if (probe.identity_verified !== true) failures.push("The latest read-only Testnet identity probe is not verified.");
const expectedLayerContracts = 7;
if (probe.network_passphrase !== "Pi Testnet") failures.push("The read-only probe did not confirm the exact Pi Testnet passphrase.");
if (probe.soroban_rpc_protocol !== network.expected_protocol) failures.push(`Soroban protocol mismatch: expected ${network.expected_protocol ?? "unset"}, observed ${probe.soroban_rpc_protocol ?? "unset"}.`);
if (probe.latest_ledger == null || !Number.isInteger(probe.latest_ledger)) failures.push("The latest Testnet ledger sequence is missing or invalid.");
if (probe.registered_layer_contract_instances_checked !== expectedLayerContracts || probe.registered_layer_contract_instances_found !== expectedLayerContracts) {
  failures.push(`All seven layer contract instances must be found by readback (${probe.registered_layer_contract_instances_found ?? 0}/${probe.registered_layer_contract_instances_checked ?? 0}; expected 7/7).`);
}

const sourcePins = manifest.source_pins?.repositories ?? {};
for (const name of ["pirc", "smartcontracts"]) {
  const sha = sourcePins[name]?.integration_sha;
  if (typeof sha !== "string" || !/^[a-f0-9]{40}$/i.test(sha)) failures.push(`Missing or invalid pinned integration commit for ${name}.`);
}

const features = manifest.feature_status ?? [];
const unresolved = features.filter((feature) => !["TESTNET_VERIFIED", "PRODUCTION_VERIFIED"].includes(feature.status));
if (unresolved.length) failures.push(`${unresolved.length} integration feature groups are not Testnet/production verified: ${unresolved.map((feature) => `${feature.id}=${feature.status}`).join("; ")}`);

console.log("Unity Sphere release gate");
console.log(`English baseline keys: ${english.size}`);
console.log(`Locales checked: ${dictionaries.size}/${locales.length}`);
console.log(`Integration feature groups: ${features.length}`);
console.log(`Mainnet writes: ${network.mainnet_writes_enabled === false ? "DISABLED" : "NOT SAFE"}`);
if (failures.length) {
  console.error(`\nBLOCKED: ${failures.length} release condition(s) remain.`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("\nPASS: all configured release conditions are satisfied.");
}
