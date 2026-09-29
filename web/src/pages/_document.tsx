import { Html, Head, Main, NextScript } from "next/document";
import { plexMono } from "@/src/styles/fonts";
import {
  getDefaultLanguage,
  languageBootstrapScript,
} from "@/src/features/i18n/config";

export default function Document() {
  return (
    <Html
      lang={getDefaultLanguage()}
      suppressHydrationWarning
      className={plexMono.variable}
    >
      <Head>
        <script dangerouslySetInnerHTML={{ __html: languageBootstrapScript }} />
        <style>{`html[data-ui-locale="zh-CN"] [data-ui-language="en"],html[data-ui-locale="en"] [data-ui-language="zh-CN"]{visibility:hidden}`}</style>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
