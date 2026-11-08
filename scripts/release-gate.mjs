#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const failures = [];
const manifest = JSON.parse(await readFile(new URL("../configs/pirc-integration-manifest.json", import.meta.url), "utf8"));
const messages = await readFile(new URL("../src/i18n/messages.ts", import.meta.url), "utf8");
const locales = ["en", "ar", "zh", "id", "fr", "es", "de", "pt"];
const dictionaries = new Map();

for (const locale of locales) {
  const start = messages.indexOf(\`const \${locale}: Dict = {\`);
  const end = messages.indexOf("\n};", start);
  if (start < 0 || end < 0) {
    failures.push(\`Missing or malformed locale dictionary: \${locale}\`);
    continue;
  }
  const block = messages.slice(start, end);
  dictionaries.set(locale, new Set([...block.matchAll(/^\s*"([^"]+)":/gm)].map((match) => match[1])));
}

const english = dictionaries.get("en") ?? new Set();
for (const locale of locales) {
  const keys = dictionaries.get(locale) ?? new Set();
  const missing = [...english].filter((key) => !keys.has(key));
  if (missing.length) failures.push(\`Locale \${locale} is missing \${missing.length}/\${english.size} English baseline keys.\`);
}

const network = manifest.target_network ?? {};
if (network.network_id !== "pi-testnet1" || network.canonical_network !== "Pi Testnet") failures.push("The release target must be the explicitly named Pi Testnet profile.");
if (network.mainnet_writes_enabled !== false) failures.push("Mainnet writes must remain disabled in the release manifest.");
if (!network.passphrase_value) failures.push("The Testnet passphrase must be configured in the deployment environment; never commit secrets.");
const probe = network.last_read_only_probe ?? {};
if (probe.identity_verified !== true) failures.push("The latest read-only Testnet identity probe is not verified.");
if (!(probe.registered_layer_contract_instances_found > 0) || probe.registered_layer_contract_instances_found !== probe.registered_layer_contract_instances_checked) {
  failures.push(\`Registered layer contract deployment readback is incomplete (\${probe.registered_layer_contract_instances_found ?? 0}/\${probe.registered_layer_contract_instances_checked ?? 0}).\`);
}

const features = manifest.feature_status ?? [];
const unresolved = features.filter((feature) => !["TESTNET_VERIFIED", "PRODUCTION_VERIFIED"].includes(feature.status));
if (unresolved.length) failures.push(\`\${unresolved.length} integration feature groups are not Testnet/production verified: \${unresolved.map((feature) => \`\${feature.id}=\${feature.status}\`).join("; ")}\`);

console.log("Unity Sphere release gate");
console.log(\`English baseline keys: \${english.size}\`);
console.log(\`Locales checked: \${dictionaries.size}/\${locales.length}\`);
console.log(\`Integration feature groups: \${features.length}\`);
console.log(\`Mainnet writes: \${network.mainnet_writes_enabled === false ? "DISABLED" : "NOT SAFE"}\`);
if (failures.length) {
  console.error(\`\nBLOCKED: \${failures.length} release condition(s) remain.\`);
  for (const failure of failures) console.error(\`- \${failure}\`);
  process.exitCode = 1;
} else {
  console.log("\nPASS: all configured release conditions are satisfied.");
}
