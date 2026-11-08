import { Composition } from "remotion";
import { Main, mainSchemaDefaults } from "./Main";
import { HotelHook } from "./hotel/HotelHook";

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
      {/* 5-second hook sample: vertical 9:16 */}
      <Composition
        id="HotelHook"
        component={HotelHook}
        durationInFrames={FPS * 5}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ captions: true }}
      />
    </>
  );
};
