# UI languages

The web UI supports English (`en`) and Simplified Chinese (`zh-CN`) using
i18next and react-i18next. Language selectors are available on sign-in/sign-up,
the account menu, and Account settings → General. A browser cookie remembers
the selection for one year; no database migration is required.

## Deployment

`NEXT_PUBLIC_LANGFUSE_DEFAULT_LANGUAGE` sets the default when there is no saved
preference. It accepts `en` (the upstream default) or `zh-CN`. This is a **build
setting**: setting it only on an already-built container does not change the UI.

For a source checkout using the root Compose deployment:

```sh
docker compose -f docker-compose.yml -f docker-compose.i18n.yml build langfuse-web
docker compose -f docker-compose.yml -f docker-compose.i18n.yml up -d --no-deps langfuse-web
```

The overlay builds `web/Dockerfile` with the Chinese default into
`langfuse-ui:zh-cn-local`. Existing base service ports, infrastructure, volumes,
and environment settings are retained. To return to the official image:

```sh
docker compose -f docker-compose.yml up -d --no-deps langfuse-web
```

For local development, set the variable in `.env` and restart `pnpm run dev:web`.
Change languages through the UI to override the default for this browser.

## Ownership

- `config.ts`: allowlisted locales, build default, cookie parsing, and the
  small bootstrap script that sets the document language before paint.
- `instance.ts` / `resources.ts`: synchronous in-memory dictionaries and an
  isolated i18next instance for each app mount/server render.
- `provider.tsx`: the app provider and language selector. Only this boundary
  integrates browser cookies and document language with i18next.
- `locales/{en,zh-CN}/*.json`: flat semantic message keys, grouped by feature.
- `../auth/lib/localizeAuthResolver.ts`: authentication-only mapping from existing
  validation messages to stable keys. `FormMessage` translates those keys while
  rendering, so visible errors follow language changes without revalidating or
  clearing a draft. Shared schemas and submitted values remain unchanged.
- `test-setup.ts`: English fallback for standalone component tests. This
  global instance is test-only; production never shares mutable request state.

The provider does not change routes, reset query caches, or remount the page on
language changes. Server rendering and initial hydration both use the build
default. If a saved browser preference differs, a pre-paint visibility rule
hides the other language until the provider restores the preference. This
preserves static page optimization without adding `_app.getInitialProps`.

Date pickers use DayPicker/date-fns locales, the editor uses CodeMirror phrases,
and number/date formatters accept explicit locales. Language does not change
the time zone, filter boundaries, underlying numbers, or USD currency. An
already-open native editor search panel applies phrases when reopened.

## Adding translations

1. Put the full message in both language dictionaries with a semantic key.
   Use interpolation for values and `Trans` for links/markup; avoid sentence
   fragments and string concatenation.
2. Obtain `t` from `useTranslation("namespace")` inside the owning component or
   hook. Pass it explicitly into pure configuration factories. Do not call a
   global translator at module initialization.
3. Translate display labels only. Keep routes, permissions, column IDs,
   accessor keys, enum values, filter values, API fields, code, model names,
   user names, prompts and recorded input/output unchanged. Add an explicit
   stable column ID before translating a header that formerly supplied the ID.
4. Include the translation function in existing memo/callback dependencies.
   Avoid translated React keys or storing translated values in state.
5. Keep shared/domain validation schemas independent of the web layer. Use
   local resolver error mappings or stable business error codes, never a
   request-specific global Zod configuration.

English is the fallback for missing translations. Translations cover the app
shell, core tracing/prompt/dataset/experiment/evaluation flows, account and basic
project/organization settings, authentication, dashboards, and API key controls.
Some specialized settings, dynamic legacy sentences, static filter/tab
configurations, and server-supplied errors still use English; extend their
owning source components rather than translating DOM nodes or customer data.

## Checks

```sh
pnpm --filter web run i18n:check
pnpm --filter web run test-client src/features/i18n/provider.clienttest.tsx
pnpm --filter web run test-client src/components/editor/CodeMirrorEditor.locale.clienttest.tsx
pnpm --filter web run test-client src/components/table/data-table-column-visibility-filter.clienttest.tsx
pnpm --filter web run test-client src/features/public-api/components/ApiKeyList.clienttest.tsx
```

The pipeline checks dictionary key parity and interpolation/rich-text contracts.
Regression tests cover saved preferences, hydration, per-instance isolation,
draft preservation, navigation targets, live authentication error translations,
column visibility, raw API keys, and editor undo history.

Implementation and acceptance status is tracked in [PROGRESS.md](./PROGRESS.md).

Browser acceptance: switch language at sign-in, sign in, open Account settings,
then exercise a trace list, date picker, prompt editor and API-key note editor.
Switch in both directions without saving the draft; verify the draft and filter
state survive, reload and verify the preference, then inspect a narrow viewport.
