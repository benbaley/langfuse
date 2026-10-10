import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { checkSourceReferences } from "./source-check.mjs";

/** @param {import("node:test").TestContext} t @param {string} source */
function audit(t, source, messages = { "form.save": "Save", welcome: "Welcome" }) {
  const root = mkdtempSync(join(tmpdir(), "i18n-source-check-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(join(root, "example.tsx"), source);
  return checkSourceReferences(root, {
    en: { common: messages },
    "zh-CN": { common: messages },
  });
}

test("resolves namespace aliases and prefixes without confusing shadowed parameters", (t) => {
  const result = audit(t, `
    import { useTranslation as useT } from "react-i18next";
    function Component() {
      const { t: message } = useT("common", { keyPrefix: "form" });
      function unrelated(message) { return message("not.a.translation"); }
      return message("save");
    }
  `);
  assert.equal(result.summary.boundCalls, 1);
  assert.deepEqual(result.findings, []);
  assert.deepEqual(result.parseErrors, []);
});

test("checks explicit namespaces and Trans while reporting dynamic keys separately", (t) => {
  const result = audit(t, `
    import { useTranslation, Trans } from "react-i18next";
    function Component({ key }) {
      const { t } = useTranslation("unused");
      t("common:welcome");
      t(key);
      return <Trans t={t} i18nKey="common:missing" />;
    }
  `);
  assert.equal(result.summary.skippedDynamicKeys, 1);
  assert.equal(result.summary.boundTrans, 1);
  assert.deepEqual(result.findings.map(({ namespace, key, missing }) => ({ namespace, key, missing })), [
    { namespace: "common", key: "missing", missing: ["en", "zh-CN"] },
  ]);
});

test("flags a key missing in just one locale", (t) => {
  const root = mkdtempSync(join(tmpdir(), "i18n-source-check-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(join(root, "example.tsx"), `
    import { useTranslation } from "react-i18next";
    function Component() { const { t } = useTranslation("common"); return t("save"); }
  `);
  const result = checkSourceReferences(root, {
    en: { common: { save: "Save" } },
    "zh-CN": { common: {} },
  });
  assert.deepEqual(result.findings[0].missing, ["zh-CN"]);
});
