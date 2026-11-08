import { Composition } from "remotion";
import { Main, mainSchemaDefaults } from "./Main";
import { HotelHook } from "./hotel/HotelHook";
import { Full, TOTAL } from "./full/Full";
import { Avatar } from "./full/Avatar";

export const FPS = 30;

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="Main"
        component={Main}
        durationInFrames={FPS * 8}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={mainSchemaDefaults}
      />
      <Composition id="Avatar" component={Avatar} durationInFrames={1} fps={30} width={800} height={800} defaultProps={{ variant: "head" as "head" | "screw" }} />
      <Composition id="AvatarHi" component={Avatar} durationInFrames={1} fps={30} width={1600} height={1600} defaultProps={{ variant: "clean" as "head" | "screw" | "clean", size: 1600 }} />
      {/* the full video: "How Chicago Lifted Itself" */}
      <Composition id="Full" component={Full} durationInFrames={Math.ceil(TOTAL * FPS)} fps={FPS} width={1080} height={1920} defaultProps={{ captions: true, audio: true }} />
      {/* 5-second hook sample: vertical 9:16 */}
      <Composition
        id="HotelHook"
        component={HotelHook}
        durationInFrames={FPS * 5}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ captions: true, audio: true }}
      />
    </>
  );
};
