import { staticFile } from "remotion";

/** Fonts are shipped in /public/fonts (all SIL Open Font License), so renders look identical on any machine. */
const FACES: [string, string, string][] = [
  ["Lilita One", "fonts/LilitaOne-Regular.ttf", "400"],
  ["Rye", "fonts/Rye-Regular.ttf", "400"],
  ["Playfair Display", "fonts/PlayfairDisplay-Variable.ttf", "400 900"],
];

let p: Promise<void> | null = null;
export const loadFonts = (): Promise<void> => {
  if (!p) {
    p = Promise.all(
      FACES.map(async ([family, path, weight]) => {
        const f = new FontFace(family, `url(${staticFile(path)})`, { weight });
        await f.load();
        (document as any).fonts.add(f);
      }),
    ).then(() => undefined).catch(() => undefined);
  }
  return p;
};
