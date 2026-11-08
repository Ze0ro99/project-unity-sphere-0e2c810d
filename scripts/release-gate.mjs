#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const failures = [];
const warnings = [];
const manifest = JSON.parse(await readFile(new URL("../configs/pirc-integration-manifest.json", import.meta.url), "utf8"));
const messages = await readFile(new URL("../src/i18n/messages.ts", import.meta.url), "utf8");

const locales = ["en", "ar", "zh", "id", "fr", "es", "de", "pt"];
const dictionaries = new Map();
for (const locale of locales) {
  const start = messages.indexOf(`const ${locale}: Dict = {`);
  const end = messages.indexOf("\n};", start);
  if (start < 0 || end < 0) {
    failures.push(`Missing or malformed locale dictionary: ${locale}`);
    continue;
  }
  const block = messages.slice(start, end);
  dictionaries.set(locale, new Map([...block.matchAll(/^\\s*"([^"]+)":\\s*"((?:\\\\.|[^"\\\\])*)"/gm)].map((m) => [m[1], m[2]])));
}

const english = dictionaries.get("en") ?? new Map();
for (const locale of locales) {
  const dict = dictionaries.get(locale) ?? new Map();
  const missing = [...english.keys()].filter((key) => !dict.has(key));
  if (missing.length) failures.push(`Locale ${locale} is missing ${missing.length}/${english.size} English baseline keys.`);
  for (const key of english.keys()) {
    const base = english.get(key) ?? "";
    const translated = dict.get(key) ?? "";
    const placeholders = (value) => [...value.matchAll(/\\{([A-Za-z0-9_]+)\\}/g)].map((m) => m[1]).sort().join(",");
    if (translated && placeholders(base) !== placeholders(translated)) {
      failures.push(`Locale ${locale} has mismatched interpolation placeholders for ${key}.`);
    }
  }
}

const network = manifest.target_network ?? {};
if (network.network_id !== "pi-testnet1" || network.canonical_network !== "Pi Testnet") failures.push("The release target must be the explicitly named Pi Testnet profile.");
if (network.mainnet_writes_enabled !== false) failures.push("Mainnet writes must remain disabled in the release manifest.");
if (!network.passphrase_value) failures.push("The verified Testnet passphrase has not been supplied to the deployment environment; do not commit secrets.");
const probe = network.last_read_only_probe ?? {};
if (probe.identity_verified !== true) failures.push("The latest read-only Testnet identity probe is not verified.");
if (!(probe.registered_layer_contract_instances_found > 0) || probe.registered_layer_contract_instances_found !== probe.registered_layer_contract_instances_checked) {
  failures.push(`Registered layer contract deployment readback is incomplete (${probe.registered_layer_contract_instances_found ?? 0}/${probe.registered_layer_contract_instances_checked ?? 0}).`);
}

const features = manifest.feature_status ?? [];
const unresolved = features.filter((feature) => !["TESTNET_VERIFIED", "PRODUCTION_VERIFIED"].includes(feature.status));
if (unresolved.length) failures.push(`${unresolved.length} integration feature groups are not Testnet/production verified: ${unresolved.map((f) => `${f.id}=${f.status}`).join("; ")}`);

console.log("Unity Sphere release gate");
console.log(`English baseline keys: ${english.size}`);
console.log(`Locales checked: ${dictionaries.size}/${locales.length}`);
console.log(`Integration feature groups: ${features.length}`);
console.log(`Mainnet writes: ${network.mainnet_writes_enabled === false ? "DISABLED" : "NOT SAFE"}`);
for (const warning of warnings) console.warn(`WARNING: ${warning}`);
if (failures.length) {
  console.error(`\\nBLOCKED: ${failures.length} release condition(s) remain.`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("\\nPASS: all configured release conditions are satisfied.");
}
