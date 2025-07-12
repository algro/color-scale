// colors.js

import { generatePerceptuallyUniformScale } from "./scale.js";
import Color from "https://colorjs.io/dist/color.js";

// 1) Export stepsCount (odd integer, e.g. 11, 13, 15…)
export const stepsCount = 13;

// Calculate startS and endS based on baseSaturation using percentage-based approach
function calculateSaturationRange(baseSaturation) {
  // startS = 10% of baseSaturation
  const startS = baseSaturation * 0.10;
  
  // endS = 25% of baseSaturation
  const endS = baseSaturation * 0.25;
  
  return {
    startS: Math.max(0.05, startS),
    endS: Math.min(0.25, endS)
  };
}

export const defaults = {
  // Lightness at step 50 and 950 (0…100) - fixed absolute values
  startL: 98,   // Very light tint
  endL:   19,   // Very dark shade
  // Saturation at step 50 and 950 (0-1) - will be auto-derived
  startS: null,   // Will be auto-derived from baseSaturation
  endS:   null,   // Will be auto-derived from baseSaturation

  // Default piecewise curves - can be overridden per color
  // Syntax: ["easingType:rate", step, "easingType:rate", step, ...]
  // Rate is optional (defaults to 1.0), allows partial progression that cascades
  lightnessCurve: ["linear:0.12", 150, "easeInOutSine:0.88", 500, "easeInOutSine:0.78",850,"linear:0.22"],
  saturationCurve: ["linear:0.12", 150, "easeInOutSine:0.88", 500, "easeInOutSine:0.65",850,"linear:0.35"],
  hueCurve: ["linear", 500, "linear"],

  // Note: Uses OKhsl color space for perceptually uniform saturation across all hues.
  // Piecewise curves control lightness, saturation, and hue progression for maximum flexibility.
};

// Export the calculation function for use in app.js
export { calculateSaturationRange };

// 3) Export your array of colorConfigs using OKhsl values directly
//    All values are in OKhsl space: h (0-1), s (0-1), l (0-1)
export const colorConfigs = [
  {
    name: "red-500",
    baseHue: 0.0652,     // #f23441  //1 would be 360° in OKHSL while this is 23.5° 
    baseSaturation: 0.9,
    baseLightness: 0.57,
    startHueShift: -8.0,
    endHueShift: -5,
    // Example: Custom saturation curve for red with rates
    // saturationCurve: ["easeOutQuad:0.4", 300, "linear:0.3", 500, "linear", 700, "easeInCubic:0.5"]
  },
  {
    name: "orange-500",
    baseHue: 0.1365,     // #f67b29
    baseSaturation: 0.94,
    baseLightness: 0.67,
    startHueShift: 26,
    endHueShift: -20
  },
  {
    name: "amber-500",
    baseHue: 0.2011,     // #f5a314
    baseSaturation: 0.99,
    baseLightness: 0.74,
    startHueShift: 20,
    endHueShift: -25
  },
  {
    name: "yellow-500",
    baseHue: 0.2301,     // #fab905
    baseSaturation: 0.99,
    baseLightness: 0.8,
    startHueShift: 15,
    endHueShift: -30
  },
  {
    name: "olive-500",
    baseHue: 0.2990,     // #c5c020
    baseSaturation: 0.9,
    baseLightness: 0.75,
    startHueShift: 0,
    endHueShift: -5
  },
  {
    name: "lime-500",
    baseHue: 0.3451,     // #9dc535
    baseSaturation: 0.85,
    baseLightness: 0.73,
    startHueShift: -10,
    endHueShift: 5
  },
  {
    name: "green-500",
    baseHue: 0.4175,     // #01c15b
    baseSaturation: 0.92,
    baseLightness: 0.65,
    startHueShift: -10,
    endHueShift: 12
  },
  {
    name: "emerald-500",
    baseHue: 0.4450,     // #0cbc7d
    baseSaturation: 0.93,
    baseLightness: 0.65,
    startHueShift: 0,
    endHueShift: 12
  },
  {
    name: "teal-500",
    baseHue: 0.5070,     // #14b8a6
    baseSaturation: 0.94,
    baseLightness: 0.65,
    startHueShift: -5,
    endHueShift: 5.0
  },
  {
    name: "cyan-500",
    baseHue: 0.6054,     // #00b8db
    baseSaturation: 0.96,
    baseLightness: 0.66,
    startHueShift: -5,
    endHueShift: -2
  },
  {
    name: "sky-500",
    baseHue: 0.6677,     // #00a6f4
    baseSaturation: 0.97,
    baseLightness: 0.64,
    startHueShift: -5,
    endHueShift: 0
  },
  {
    name: "blue-500",
    baseHue: 0.7200,     // #3d88fd
    baseSaturation: 0.95,
    baseLightness: 0.58,
    startHueShift: -5,
    endHueShift: 5
  },
  {
    name: "indigo-500",
    baseHue: 0.7587,     // #5766fc
    baseSaturation: 0.94,
    baseLightness: 0.52,
    startHueShift: -5,
    endHueShift: 0
  },
  {
    name: "iris-500",
    baseHue: 0.7879,     // #6d4aff
    baseSaturation: 0.979,
    baseLightness: 0.492,
    startHueShift: -5,
    endHueShift: 7
  },
  {
    name: "violet-500",
    baseHue: 0.8164,     // #8e51ff
    baseSaturation: 0.96,
    baseLightness: 0.53,
    startHueShift: -5.0,
    endHueShift: 5.0
  },
  {
    name: "purple-500",
    baseHue: 0.8482,     // #ad48fe
    baseSaturation: 0.97,
    baseLightness: 0.55,
    startHueShift: 4.5,
    endHueShift: -1.2
  },
  {
    name: "fuchsia-500",
    baseHue: 0.8950,     // #d641ec
    baseSaturation: 0.92,
    baseLightness: 0.56,
    startHueShift: -2.5,
    endHueShift: 3.5
  },
  {
    name: "pink-500",
    baseHue: 0.9751,     // #f53da5
    baseSaturation: 0.91,
    baseLightness: 0.57,
    startHueShift: -5,
    endHueShift: 3
  },
  {
    name: "rose-500",
    baseHue: 0.0466,     // #ee3a59
    baseSaturation: 0.9,
    baseLightness: 0.57,
    startHueShift: -4.0,
    endHueShift: -12
  },
  {
    name: "sand-500",
    baseHue: 0.0702,     // #99615c
    baseSaturation: 0.377,
    baseLightness: 0.48,
    startHueShift: 10.0,
    endHueShift: -20.0,
    startS: 0.02,  // Low saturation at step 50
    endS: 0.04     // Low saturation at step 950
  },
  {
    name: "slate-500",
    baseHue: 0.7134,     // #617085
    baseSaturation: 0.2,
    baseLightness: 0.45,
    startHueShift: -8.0,
    endHueShift: 8.0,
    startS: 0.02,  // Low saturation at step 50
    endS: 0.04     // Low saturation at step 950
  },
  {
    name: "grey-500",
    baseHue: 0.7378,     // #636a79
    baseSaturation: 0.134,
    baseLightness: 0.45,
    startHueShift: -10,
    endHueShift: -5,
    startS: 0.02,  // Very low saturation at step 50
    endS: 0.02     // Very low saturation at step 950
  },
  {
    name: "zinc-500",
    baseHue: 0.7943,     // #67676f
    baseSaturation: 0.067,
    baseLightness: 0.45,
    startHueShift: 0.0,
    endHueShift: 0.0,
    startS: 0.02,  // Very low saturation at step 50
    endS: 0.02     // Very low saturation at step 950
  },
  {
    name: "neutral-500",
    baseHue: 0.2497,     // #686868
    baseSaturation: 0.000,
    baseLightness: 0.45,
    startHueShift: 0.0,
    endHueShift: 0.0,
    startS: 0.0,  // No saturation (pure grayscale)
    endS: 0.0     // No saturation (pure grayscale)
  }
];

