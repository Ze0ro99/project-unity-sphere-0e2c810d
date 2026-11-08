#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/i18n/messages.ts", import.meta.url), "utf8");
const localeNames = ["en", "ar", "zh", "id", "fr", "es", "de", "pt"];
const dictionaries = new Map();

function parse(locale) {
  const start = source.indexOf(`const ${locale}: Dict = {`);
  if (start < 0) throw new Error(`Missing locale dictionary: ${locale}`);
  const end = source.indexOf("\n};", start);
  if (end < 0) throw new Error(`Unterminated locale dictionary: ${locale}`);
  const block = source.slice(start, end);
  const entries = new Map();
  const pattern = /^\s*"([^"]+)"\s*:\s*(?:"((?:\\.|[^"\\])*)"|[\r\n]+\s*"((?:\\.|[^"\\])*)")/gm;
  for (const match of block.matchAll(pattern)) {
    if (entries.has(match[1])) throw new Error(`Duplicate key ${match[1]} in ${locale}`);
    entries.set(match[1], match[2] ?? match[3] ?? "");
  }
  return entries;
}

for (const locale of localeNames) dictionaries.set(locale, parse(locale));
const baseline = dictionaries.get("en");
const placeholders = (value) => [...value.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((match) => match[1]).sort().join("|");
let failed = false;
console.log("i18n baseline: " + baseline.size + " English keys\n");

for (const locale of localeNames) {
  const dictionary = dictionaries.get(locale);
  const missing = [...baseline.keys()].filter((key) => !dictionary.has(key));
  const empty = [...dictionary].filter(([, value]) => !value.trim()).map(([key]) => key);
  const mismatched = [...baseline].filter(([key, value]) => dictionary.has(key) && placeholders(value) !== placeholders(dictionary.get(key)));
  const coverage = baseline.size ? ((baseline.size - missing.length) / baseline.size) * 100 : 100;
  const complete = missing.length === 0 && empty.length === 0 && mismatched.length === 0;
  console.log(`${locale.padEnd(3)} ${coverage.toFixed(1).padStart(5)}%  ${String(dictionary.size).padStart(3)} keys  ${complete ? "complete" : "incomplete"}`);
  if (!complete) {
    failed = true;
    for (const key of missing) console.log(`    missing: ${key}`);
    for (const key of empty) console.log(`    empty: ${key}`);
    for (const [key] of mismatched) console.log(`    placeholder mismatch: ${key}`);
  }
}

if (process.argv.includes("--strict") && failed) {
  console.error("\nStrict locale audit failed.");
  process.exitCode = 1;
} else if (failed) {
  console.warn("\nSome locales are incomplete and must remain disabled in the language selector.");
}
