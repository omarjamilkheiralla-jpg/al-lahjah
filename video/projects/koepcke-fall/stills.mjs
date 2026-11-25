// Render test stills of the Juliane composition (one browser, many frames).
// node projects/koepcke-fall/stills.mjs <outdir> <scale> <frame,frame,...> [captions]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
const [outdir, scale, frames, cap] = process.argv.slice(2);
const entry = path.resolve("src/index.ts");
const serveUrl = await bundle({ entryPoint: entry, webpackOverride: (c) => c });
const browser = await openBrowser("chrome", { chromiumOptions: { gl: "angle" } });
const inputProps = { captions: cap === "1", audio: false, vertical: process.env.COMP === "JulianeVertical" };
const composition = await selectComposition({ serveUrl, id: process.env.COMP || "Juliane", inputProps, puppeteerInstance: browser });
for (const f of frames.split(",").map(Number)) {
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, output: path.join(outdir, `f${String(f).padStart(5, "0")}.png`), frame: f, inputProps, scale: Number(scale), puppeteerInstance: browser, chromiumOptions: { gl: "angle" }, timeoutInMilliseconds: 240000 });
  console.log("frame", f, ((Date.now() - t0) / 1000).toFixed(1) + "s");
}
await browser.close({ silent: true });
