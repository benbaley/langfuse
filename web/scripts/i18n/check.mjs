import { checkSourceReferences } from "./source-check.mjs";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(
  new URL("../../src/features/i18n/locales/", import.meta.url),
);
const namespaces = readdirSync(join(root, "en")).filter((file) =>
  file.endsWith(".json"),
);
const problems = [];
const dictionaries = { en: {}, "zh-CN": {} };
let messages = 0;
/** @param {string} value */
const tokens = (value) =>
  [...value.matchAll(/\{\{\s*([^}]+)\s*\}\}|<\/?([\w]+)\b[^>]*>/g)]
    .map((match) => match[1]?.trim() ?? match[2])
    .sort()
    .join("|");

for (const namespace of namespaces) {
  const english = JSON.parse(readFileSync(join(root, "en", namespace), "utf8"));
  const chinese = JSON.parse(
    readFileSync(join(root, "zh-CN", namespace), "utf8"),
  );
  dictionaries.en[namespace.slice(0, -5)] = english;
  dictionaries["zh-CN"][namespace.slice(0, -5)] = chinese;
  for (const key of new Set([
    ...Object.keys(english),
    ...Object.keys(chinese),
  ])) {
    const en = english[key];
    const zh = chinese[key];
    if (
      typeof en !== "string" ||
      typeof zh !== "string" ||
      !en.trim() ||
      !zh.trim()
    ) {
      problems.push(`${namespace}: ${key} is missing or empty in one language`);
    } else if (tokens(en) !== tokens(zh)) {
      problems.push(
        `${namespace}: ${key} has mismatched interpolation variables or rich-text tags`,
      );
    }
    messages++;
  }
}
const sourceReport = checkSourceReferences(
  fileURLToPath(new URL("../../src/", import.meta.url)),
  dictionaries,
);
for (const finding of sourceReport.findings) {
  problems.push(
    `${finding.file}:${finding.line}: missing ${finding.namespace}:${finding.key} (${finding.missing.join(", ")})`,
  );
}
for (const failure of sourceReport.parseErrors) {
  problems.push(`${failure.file}: ${failure.error}`);
}
console.log(
  `i18n references: ${sourceReport.summary.boundCalls} bound calls, ${sourceReport.summary.boundTrans} Trans, ${sourceReport.summary.skippedDynamicKeys} dynamic keys require review, ${sourceReport.summary.missing} missing`,
);
if (problems.length) {
  console.error(problems.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `i18n: ${messages} messages across ${namespaces.length} namespaces validated (en, zh-CN)`,
  );
}
