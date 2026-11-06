import { Composition } from "remotion";
import { Main, mainSchemaDefaults } from "./Main";

export const FPS = 30;

export const Root: React.FC = () => {
  return (
    <Composition
      id="Main"
      component={Main}
      durationInFrames={FPS * 8}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={mainSchemaDefaults}
    />
  );
};
