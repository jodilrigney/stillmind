import { ScrollViewStyleReset } from "expo-router/html";

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover, interactive-widget=resizes-content"
        />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `html, body, #root { height: 100%; height: 100dvh; width: 100%; margin: 0; overflow: hidden; box-sizing: border-box; } img, picture, video, canvas { -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; -webkit-user-drag: none; }`,
          }}
        />
        <title>StillMind</title>
        <meta
          name="description"
          content="StillMind is a privacy-first calm space. Simple EMDR is one slow tracking light inside Lighten. Keep breathing naturally. Health data stays on the device. Readable overview: https://jodilrigney.github.io/stillmind/overview.html"
        />
      </head>
      <body>
        <noscript>
          <main style={{ fontFamily: "Georgia, serif", maxWidth: "40rem", margin: "2rem auto", padding: "0 1rem", lineHeight: 1.5 }}>
            <h1>StillMind</h1>
            <p>
              This live page needs JavaScript in a real browser. Language models cannot click it. Read the full app here instead:{" "}
              <a href="/stillmind/overview.html">overview.html</a>
            </p>
            <p>Privacy-first calm space. Health data stays on the device. Not therapy or emergency care.</p>
            <p>
              Home is STILL: Still-mind Reset, Tri-Calm, Inhale, Lighten (firefly), Land. Simple EMDR opens from Lighten: one slow
              light to follow, tap to pause, drag the light to where a feeling showed up, breathe naturally, then let it go.
            </p>
          </main>
        </noscript>
        {children}
      </body>
    </html>
  );
}
