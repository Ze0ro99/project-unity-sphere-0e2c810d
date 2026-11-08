#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/i18n/messages.ts", import.meta.url), "utf8");
const localeNames = ["en", "ar", "zh", "id", "fr", "es", "de", "pt"];
const dictionaries = new Map();

for (const locale of localeNames) {
  const marker = `const ${locale}: Dict = {`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Missing locale dictionary: ${locale}`);
  const end = source.indexOf("\n};", start);
  if (end < 0) throw new Error(`Unterminated locale dictionary: ${locale}`);
  const block = source.slice(start, end);
  dictionaries.set(locale, new Set([...block.matchAll(/^\\s*"([^"]+)":/gm)].map((match) => match[1])));
}

const baseline = dictionaries.get("en");
let incomplete = false;
console.log(`i18n key baseline: ${baseline.size} English keys\n`);

for (const locale of localeNames) {
  const keys = dictionaries.get(locale);
  const missing = [...baseline].filter((key) => !keys.has(key));
  const coverage = baseline.size === 0 ? 100 : ((keys.size - missing.length) / baseline.size) * 100;
  const state = missing.length === 0 ? "complete" : "incomplete";
  console.log(`${locale.padEnd(3)} ${coverage.toFixed(1).padStart(5)}%  ${keys.size.toString().padStart(3)} keys  ${state}`);
  if (missing.length) {
    incomplete = true;
    for (const key of missing) console.log(`    missing: ${key}`);
  }
}

if (process.argv.includes("--strict") && incomplete) {
  console.error("\nStrict locale audit failed: at least one locale is missing English baseline keys.");
  process.exitCode = 1;
} else if (incomplete) {
  console.warn("\nWarning: incomplete locales use English fallback. Run with --strict to enforce full parity.");
}
