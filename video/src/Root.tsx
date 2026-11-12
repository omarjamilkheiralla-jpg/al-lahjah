import { Composition } from "remotion";
import { Main, mainSchemaDefaults } from "./Main";
import { HotelHook } from "./hotel/HotelHook";
import { Full, TOTAL } from "./full/Full";
import { Avatar } from "./full/Avatar";
import { RatsFull, RATS_TOTAL, FPS as RATS_FPS } from "./rats/RatsFull";
import { AntiFull, ANTI_TOTAL, FPS as ANTI_FPS } from "./anti/AntiFull";
import { Thumb } from "./rats/Thumb";
import { EmuFull, EMU_TOTAL, FPS as EMU_FPS } from "./emu/EmuFull";
import { TownFull, TOWN_TOTAL, FPS as TOWN_FPS } from "./town/TownFull";
import { Style2Sample, STYLE2_TOTAL, FPS as S2_FPS } from "./style2/Style2Sample";

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
      <Composition id="Rats" component={RatsFull} durationInFrames={Math.ceil(RATS_TOTAL * RATS_FPS)} fps={RATS_FPS} width={1080} height={1920} defaultProps={{ captions: true, audio: true }} />
      <Composition id="Anti" component={AntiFull} durationInFrames={Math.ceil(ANTI_TOTAL * ANTI_FPS)} fps={ANTI_FPS} width={1080} height={1920} defaultProps={{ captions: true, audio: true }} />
      <Composition id="ThumbRatsV" component={Thumb} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{ w: 1080, h: 1920 }} />
      <Composition id="ThumbRatsH" component={Thumb} durationInFrames={1} fps={30} width={1280} height={720} defaultProps={{ w: 1280, h: 720 }} />
      <Composition id="Style2Sample" component={Style2Sample} durationInFrames={Math.ceil(STYLE2_TOTAL * S2_FPS)} fps={S2_FPS} width={1080} height={1920} defaultProps={{ audio: true }} />
      <Composition id="Town" component={TownFull} durationInFrames={Math.ceil(TOWN_TOTAL * TOWN_FPS)} fps={TOWN_FPS} width={1920} height={1080} defaultProps={{ captions: true, audio: true }} />
      <Composition id="Emu" component={EmuFull} durationInFrames={Math.ceil(EMU_TOTAL * EMU_FPS)} fps={EMU_FPS} width={1080} height={1920} defaultProps={{ captions: true, audio: true }} />
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
