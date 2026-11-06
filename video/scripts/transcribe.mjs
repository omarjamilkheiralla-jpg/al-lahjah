// Usage: npm run transcribe -- public/narration.mp3
// Installs whisper.cpp on first run, converts audio to 16kHz wav, transcribes it
// and writes word-level captions to public/captions.json for <Captions />.
import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";
import {
  installWhisperCpp,
  downloadWhisperModel,
  transcribe,
  toCaptions,
} from "@remotion/install-whisper-cpp";

const input = process.argv[2];
if (!input) {
  console.error("Usage: npm run transcribe -- <audio-or-video-file> [lang]");
  process.exit(1);
}
const lang = process.argv[3] ?? "auto"; // e.g. "en", "ar"
const whisperPath = path.join(process.cwd(), "whisper.cpp");
const model = "medium"; // use "base.en" for fast English-only
const wav = path.join(process.cwd(), "out", "whisper-input.wav");

await installWhisperCpp({ to: whisperPath, version: "1.5.5" });
await downloadWhisperModel({ model, folder: whisperPath });

fs.mkdirSync(path.dirname(wav), { recursive: true });
execSync(`ffmpeg -y -i "${input}" -ar 16000 -ac 1 "${wav}"`, { stdio: "inherit" });

const whisperCppOutput = await transcribe({
  inputPath: wav,
  whisperPath,
  model,
  tokenLevelTimestamps: true,
  language: lang === "auto" ? null : lang,
});
const { captions } = toCaptions({ whisperCppOutput });
fs.writeFileSync("public/captions.json", JSON.stringify(captions, null, 2));
console.log(`Wrote ${captions.length} captions to public/captions.json`);
