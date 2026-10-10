import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parsers } from "prettier/plugins/babel";

/** @typedef {ReturnType<typeof parsers["babel-ts"]["parse"]>} AstNode */
/** @typedef {Record<string, Record<string, Record<string, unknown>>>} Dictionaries */
/** @typedef {{ ns: string, prefix?: string }} Binding */
/** @typedef {{ parent: Scope | null, bindings: Map<string, Binding | null> }} Scope */
/** @typedef {{ file: string, line: number, kind: string, namespace: string, key: string, missing: string[] }} Finding */

/** @param {string} directory @returns {string[]} */
function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) &&
      !/\.(clienttest|servertest|stories|test)\./.test(entry.name)
      ? [path]
      : [];
  });
}

// Resolve each translator in its lexical scope. Calls through helpers or with
// dynamic keys are reported as unverified, rather than assigned a guessed namespace.
/** @param {string} sourceRoot @param {Dictionaries} dictionaries */
export function checkSourceReferences(sourceRoot, dictionaries) {
  const parse = parsers["babel-ts"].parse;
  /** @type {Finding[]} */
  const findings = [];
  /** @type {{ file: string, error: string }[]} */
  const parseErrors = [];
  let boundCalls = 0,
    boundTrans = 0,
    hookBindings = 0,
    skippedDynamicKeys = 0,
    scanned = 0;
  /** @param {AstNode} n @returns {AstNode[]} */
  function childNodes(n) {
    return Object.entries(n)
      .filter(
        ([k]) => !["loc", "comments", "tokens", "errors", "extra"].includes(k),
      )
      .flatMap(([, value]) => {
        if (Array.isArray(value))
          return value.filter(
            (item) => item && typeof item === "object" && item.type,
          );
        return value &&
          typeof value === "object" &&
          "type" in value &&
          value.type
          ? [value]
          : [];
      });
  }
  /** @param {AstNode} pattern @returns {string[]} */
  function names(pattern) {
    if (!pattern) return [];
    if (pattern.type === "Identifier") return [pattern.name];
    if (pattern.type === "ObjectPattern")
      return pattern.properties.flatMap(
        /** @param {AstNode} p */ (p) => names(p.value ?? p.argument),
      );
    if (pattern.type === "ArrayPattern") return pattern.elements.flatMap(names);
    if (pattern.type === "AssignmentPattern") return names(pattern.left);
    if (pattern.type === "RestElement") return names(pattern.argument);
    return [];
  }
  /** @param {AstNode} n @param {string} k @returns {AstNode} */
  function property(n, k) {
    return n?.type === "ObjectExpression"
      ? n.properties.find(
          /** @param {AstNode} p */ (p) =>
            p.type === "ObjectProperty" && (p.key.name ?? p.key.value) === k,
        )?.value
      : undefined;
  }
  /** @param {AstNode} n @returns {string | undefined} */
  function literal(n) {
    if (n?.type === "StringLiteral") return n.value;
    if (n?.type === "TemplateLiteral" && n.expressions.length === 0)
      return n.quasis[0].value.cooked;
    return undefined;
  }
  for (const file of sourceFiles(sourceRoot)) {
    const source = readFileSync(file, "utf8");
    if (
      !source.includes("useTranslation") &&
      !source.includes("useNavigationTranslation")
    )
      continue;
    let ast;
    try {
      ast = parse(
        source,
        /** @type {import("prettier").ParserOptions} */ ({
          parser: "babel-ts",
        }),
      );
    } catch (e) {
      parseErrors.push({
        file,
        error: e instanceof Error ? e.message : String(e),
      });
      continue;
    }
    scanned++;
    const hooks = new Set(),
      transNames = new Set();
    for (const n of ast.program.body) {
      if (n.type === "ImportDeclaration" && n.source.value === "react-i18next")
        for (const s of n.specifiers) {
          if (s.imported?.name === "useTranslation") hooks.add(s.local.name);
          if (s.imported?.name === "Trans") transNames.add(s.local.name);
        }
    }
    /** @param {Scope | null} scope @param {string} name */
    function lookup(scope, name) {
      while (scope) {
        if (scope.bindings.has(name)) return scope.bindings.get(name);
        scope = scope.parent;
      }
      return undefined;
    }
    /** @param {AstNode} d @param {Scope} scope */
    function bindDecl(d, scope) {
      if (d.type === "VariableDeclaration")
        for (const v of d.declarations) {
          for (const name of names(v.id)) scope.bindings.set(name, null);
          const call = v.init;
          if (
            v.id.type !== "ObjectPattern" ||
            call?.type !== "CallExpression" ||
            !hooks.has(call.callee?.name)
          )
            continue;
          const ns = literal(call.arguments[0]);
          if (!ns) continue;
          const prefix = literal(property(call.arguments[1], "keyPrefix"));
          for (const prop of v.id.properties) {
            if (
              prop.type === "ObjectProperty" &&
              (prop.key.name ?? prop.key.value) === "t" &&
              prop.value.type === "Identifier"
            ) {
              scope.bindings.set(prop.value.name, { ns, prefix });
              hookBindings++;
            }
          }
        }
      else if (d.type === "FunctionDeclaration" && d.id)
        scope.bindings.set(d.id.name, null);
    }
    /**
     * @param {string | undefined} key
     * @param {Binding} binding
     * @param {AstNode} options
     * @param {AstNode} node
     * @param {string} kind
     */
    function verify(key, binding, options, node, kind) {
      if (!binding) return;
      if (key === undefined) {
        skippedDynamicKeys++;
        return;
      }
      let ns = binding.ns,
        prefix = binding.prefix;
      const explicitNS = property(options, "ns");
      if (explicitNS) {
        const s = literal(explicitNS);
        if (!s) return;
        ns = s;
      }
      const explicitPrefix = property(options, "keyPrefix");
      if (explicitPrefix) {
        const s = literal(explicitPrefix);
        if (s === undefined) return;
        prefix = s;
      }
      if (key.includes(":")) {
        [ns, key] = [
          key.slice(0, key.indexOf(":")),
          key.slice(key.indexOf(":") + 1),
        ];
      }
      if (prefix) key = prefix + "." + key;
      const missing = [];
      for (const lang of ["en", "zh-CN"]) {
        const dict = dictionaries[lang][ns];
        if (!dict) {
          missing.push(lang + ":namespace");
          continue;
        }
        const nested = key
          .split(".")
          .reduce(
            /** @param {unknown} o @returns {unknown} */ (o, k) =>
              /** @type {Record<string, unknown> | null | undefined} */ (o)?.[
                k
              ],
            dict,
          );
        if (
          dict[key] !== undefined ||
          nested !== undefined ||
          Object.keys(dict).some((k) => k.startsWith(key + "_"))
        )
          continue;
        missing.push(lang);
      }
      if (missing.length)
        findings.push({
          file,
          line: node.loc.start.line,
          kind,
          namespace: ns,
          key,
          missing,
        });
    }
    /** @param {AstNode} n @param {Scope | null} scope */
    function visit(n, scope) {
      if (!n || typeof n !== "object") return;
      const isFunction = [
        "FunctionDeclaration",
        "FunctionExpression",
        "ArrowFunctionExpression",
        "ObjectMethod",
        "ClassMethod",
      ].includes(n.type);
      let local = scope;
      if (
        n.type === "Program" ||
        n.type === "BlockStatement" ||
        isFunction ||
        n.type === "CatchClause"
      ) {
        local = { parent: scope, bindings: new Map() };
        if (isFunction)
          for (const param of n.params)
            for (const name of names(param)) local.bindings.set(name, null);
        if (n.type === "CatchClause")
          for (const name of names(n.param)) local.bindings.set(name, null);
        if (n.type === "Program" || n.type === "BlockStatement")
          for (const s of n.body)
            bindDecl(
              s.type === "ExportNamedDeclaration" ||
                s.type === "ExportDefaultDeclaration"
                ? (s.declaration ?? s)
                : s,
              local,
            );
      }
      if (n.type === "CallExpression" && n.callee.type === "Identifier") {
        const binding = lookup(local, n.callee.name);
        if (binding) {
          boundCalls++;
          verify(literal(n.arguments[0]), binding, n.arguments[1], n, "call");
        }
      }
      if (n.type === "JSXOpeningElement" && transNames.has(n.name.name)) {
        /** @param {string} k @returns {AstNode} */
        const attr = (k) =>
          n.attributes.find(
            /** @param {AstNode} a */ (a) =>
              a.type === "JSXAttribute" && a.name.name === k,
          )?.value;
        const tv = attr("t");
        const keyNode = attr("i18nKey");
        if (
          tv?.type === "JSXExpressionContainer" &&
          tv.expression.type === "Identifier"
        ) {
          const binding = lookup(local, tv.expression.name);
          if (binding) {
            boundTrans++;
            verify(
              literal(
                keyNode?.type === "JSXExpressionContainer"
                  ? keyNode.expression
                  : keyNode,
              ),
              binding,
              undefined,
              n,
              "Trans",
            );
          }
        }
      }
      for (const child of childNodes(n)) visit(child, local);
    }
    visit(ast.program, null);
  }
  return {
    summary: {
      scanned,
      hookBindings,
      boundCalls,
      boundTrans,
      skippedDynamicKeys,
      parseErrors: parseErrors.length,
      missing: findings.length,
    },
    findings,
    parseErrors,
  };
}
