import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// "swangle" = software WebGL, works on servers/CI without a GPU. On a laptop with a GPU use "angle" for faster renders.
Config.setChromiumOpenGlRenderer("swangle");
