#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const failures = [];
const manifest = JSON.parse(await readFile(new URL("../configs/pirc-integration-manifest.json", import.meta.url), "utf8"));
const messages = await readFile(new URL("../src/i18n/messages.ts", import.meta.url), "utf8");
const locales = ["en", "ar", "zh", "id", "fr", "es", "de", "pt"];
const dictionaries = new Map();

function parseDictionary(locale) {
  const start = messages.indexOf(`const ${locale}: Dict = {`);
  if (start < 0) return null;
  const end = messages.indexOf("\n};", start);
  if (end < 0) return null;
  const block = messages.slice(start, end);
  const entries = new Map();
  for (const match of block.matchAll(/^\s*"([^"]+)"\s*:\s*(?:"((?:\\\\.|[^"\\\\])*)"|\n\s*"((?:\\\\.|[^"\\\\])*)")/gm)) {
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
for (const locale of locales) {
  if (locale === "en") continue;
  const dictionary = dictionaries.get(locale);
  if (!dictionary) continue;
  const missing = [...english.keys()].filter((key) => !dictionary.has(key));
  const mismatched = [...english.keys()].filter((key) => dictionary.has(key) && placeholders(english.get(key)) !== placeholders(dictionary.get(key)));
  if (missing.length) failures.push(`Locale ${locale} is missing ${missing.length}/${english.size} English baseline keys.`);
  if (mismatched.length) failures.push(`Locale ${locale} has ${mismatched.length} interpolation-placeholder mismatches.`);
}

const network = manifest.target_network ?? {};
if (network.network_id !== "pi-testnet1" || network.canonical_network !== "Pi Testnet") failures.push("The release target must be the explicitly named Pi Testnet profile.");
if (network.mainnet_writes_enabled !== false) failures.push("Mainnet writes must remain disabled in the release manifest.");
if (!process.env.PI_NETWORK_PASSPHRASE) failures.push("PI_NETWORK_PASSPHRASE must be configured as a protected deployment secret; secret values are never read from the manifest.");
const probe = network.last_read_only_probe ?? {};
if (probe.identity_verified !== true) failures.push("The latest read-only Testnet identity probe is not verified.");
if (!(probe.registered_layer_contract_instances_found > 0) || probe.registered_layer_contract_instances_found !== probe.registered_layer_contract_instances_checked) {
  failures.push(`Registered layer contract deployment readback is incomplete (${probe.registered_layer_contract_instances_found ?? 0}/${probe.registered_layer_contract_instances_checked ?? 0}).`);
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
