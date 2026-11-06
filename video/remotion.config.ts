import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// "angle" uses your GPU (what you want on your Windows PC).
// On a server/CI with no GPU run with: REMOTION_GL=swangle npm run render
const gl = (process.env.REMOTION_GL ?? "angle") as "angle" | "swangle" | "egl" | "vulkan";
Config.setChromiumOpenGlRenderer(gl);
