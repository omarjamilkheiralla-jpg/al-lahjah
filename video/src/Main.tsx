import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { Scene3D } from "./Scene3D";
import { Captions } from "./Captions";
import captions from "../public/captions.json";
import type { Caption } from "@remotion/captions";

export const mainSchemaDefaults = {
  // Put your narration / music in /public and change this filename.
  audioFile: "audio.wav" as string | null,
  accent: "#ffb703",
};

export const Main: React.FC<typeof mainSchemaDefaults> = ({ audioFile, accent }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b1020" }}>
      <Scene3D accent={accent} />
      <Sequence>
        <Captions captions={captions as Caption[]} accent={accent} />
      </Sequence>
      {audioFile ? <Audio src={staticFile(audioFile)} volume={0.8} /> : null}
    </AbsoluteFill>
  );
};
