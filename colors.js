// colors.js

import { generatePerceptuallyUniformScale } from "./scale.js";
import Color from "https://colorjs.io/dist/color.js";

// 1) Export stepsCount (odd integer, e.g. 11, 13, 15…)
export const stepsCount = 13;


export const defaults = {
  // Lightness at step 50 and 950 (0…100)
  startL: 98,  
  endL:   19,  
  // Saturation at step 50 and 950 (0-1)
  startS: 0.1,   // Saturation at step 50 (lightest)
  endS:   0.25,  // Saturation at step 950 (darkest)

  // Default piecewise curves - can be overridden per color
  // Syntax: ["easingType:rate", step, "easingType:rate", step, ...]
  // Rate is optional (defaults to 1.0), allows partial progression that cascades
  lightnessCurve: ["linear:0.12", 150, "easeInOutSine:0.88", 500, "easeInOutSine:0.78",850,"linear:0.22"],
  saturationCurve: ["linear:0.12", 150, "easeInOutSine:0.88", 500, "easeInOutSine:0.65",850,"linear:0.35"],
  hueCurve: ["linear", 500, "linear"],

  // Note: Uses OKhsl color space for perceptually uniform saturation across all hues.
  // Piecewise curves control lightness, saturation, and hue progression for maximum flexibility.
};

// 3) Export your array of colorConfigs using OKhsl values directly
//    All values are in OKhsl space: h (0-1), s (0-1), l (0-1)
export const colorConfigs = [
  {
    name: "red-500", 
    baseHue: 0.0,        // Red hue (0-1)
    baseSaturation: 0.8, // Perceptually uniform saturation
    baseLightness: 0.6,  // Perceptually uniform lightness
    startHueShift: -8.0,
    endHueShift: -5,
    // Example: Custom saturation curve for red with rates
    // saturationCurve: ["easeOutQuad:0.4", 300, "linear:0.3", 500, "linear", 700, "easeInCubic:0.5"]
  },
  {
    name: "orange-500",
    baseHue: 0.0833,     // Orange hue (30° / 360°)
    baseSaturation: 0.8,
    baseLightness: 0.6,
    startHueShift: 26,
    endHueShift: -20
  },
  {
    name: "amber-500",
    baseHue: 0.1111,     // Amber hue (40° / 360°)
    baseSaturation: 0.8,
    baseLightness: 0.6,
    startHueShift: 20,
    endHueShift: -25
  },
  {
    name: "yellow-500",
    baseHue: 0.1389,     // Yellow hue (50° / 360°)
    baseSaturation: 0.8,
    baseLightness: 0.6,
    startHueShift: 15,
    endHueShift: -30
  },
  {
    name: "olive-500",
    baseHue: 0.1667,     // Olive hue (60° / 360°)
    baseSaturation: 0.8,
    baseLightness: 0.6,
    startHueShift: 0,
    endHueShift: -5
  },
  {
    name: "lime-500",
    baseHue: 0.1944,     // Lime hue (70° / 360°)
    baseSaturation: 0.8,
    baseLightness: 0.6,
    startHueShift: -10,
    endHueShift: 5
  },
  {
    name: "green-500",
    baseHue: 0.3333,     // Green hue (120° / 360°)
    baseSaturation: 0.8,
    baseLightness: 0.6,
    startHueShift: -10,
    endHueShift: 12
  },
  {
    name: "emerald-500",
    baseHue: 0.4167,     // Emerald hue (150° / 360°)
    baseSaturation: 0.8,
    baseLightness: 0.6,
    startHueShift: 0,
    endHueShift: 12
  },
  {
    name: "teal-500",
    baseHue: 0.5,        // Teal hue (180° / 360°)
    baseSaturation: 0.8,
    baseLightness: 0.6,
    startHueShift: -5,
    endHueShift: 5.0
  },
  {
    name: "cyan-500",
    baseHue: 0.5278,     // Cyan hue (190° / 360°)
    baseSaturation: 0.8,
    baseLightness: 0.6,
    startHueShift: -5,
    endHueShift: -2
  },
  {
    name: "sky-500",
    baseHue: 0.5556,     // Sky hue (200° / 360°)
    baseSaturation: 0.8,
    baseLightness: 0.6,
    startHueShift: -5,
    endHueShift: 0
  },
  {
    name: "blue-500",
    baseHue: 0.6111,     // Blue hue (220° / 360°)
    baseSaturation: 0.8,
    baseLightness: 0.6,
    startHueShift: -5,
    endHueShift: 5
  },
  {
    name: "indigo-500",
    baseHue: 0.6667,     // Indigo hue (240° / 360°)
    baseSaturation: 0.8,
    baseLightness: 0.6,
    startHueShift: -5,
    endHueShift: 0
  },
  {
    name: "iris-500",
    baseHue: 0.7222,     // Iris hue (260° / 360°)
    baseSaturation: 0.8,
    baseLightness: 0.6,
    startHueShift: -5,
    endHueShift: 7
  },
  {
    name: "violet-500",
    baseHue: 0.7778,     // Violet hue (280° / 360°)
    baseSaturation: 0.8,
    baseLightness: 0.6,
    startHueShift: -5.0,
    endHueShift: 5.0
  },
  {
    name: "purple-500",
    baseHue: 0.8333,     // Purple hue (300° / 360°)
    baseSaturation: 0.8,
    baseLightness: 0.6,
    startHueShift: 4.5,
    endHueShift: -1.2
  },
  {
    name: "fuchsia-500",
    baseHue: 0.8889,     // Fuchsia hue (320° / 360°)
    baseSaturation: 0.8,
    baseLightness: 0.6,
    startHueShift: -2.5,
    endHueShift: 3.5
  },
  {
    name: "pink-500",
    baseHue: 0.9167,     // Pink hue (330° / 360°)
    baseSaturation: 0.8,
    baseLightness: 0.6,
    startHueShift: -5,
    endHueShift: 3
  },
  {
    name: "rose-500",
    baseHue: 0.9722,     // Rose hue (350° / 360°)
    baseSaturation: 0.8,
    baseLightness: 0.6,
    startHueShift: -4.0,
    endHueShift: -12
  },
  {
    name: "sand-500",
    baseHue: 0.0833,     // Sand hue (similar to orange but muted)
    baseSaturation: 0.2, // Low saturation for muted appearance
    baseLightness: 0.6,
    startHueShift: 10.0,
    endHueShift: -20.0,
    startS: 0.02,  // Low saturation at step 50
    endS: 0.04     // Low saturation at step 950
  },
  {
    name: "slate-500",
    baseHue: 0.6667,     // Slate hue (similar to indigo but muted)
    baseSaturation: 0.2, // Low saturation for muted appearance
    baseLightness: 0.6,
    startHueShift: -8.0,
    endHueShift: 8.0,
    startS: 0.02,  // Low saturation at step 50
    endS: 0.04     // Low saturation at step 950
  },
  {
    name: "grey-500",
    baseHue: 0.6667,     // Grey hue (similar to slate)
    baseSaturation: 0.1, // Very low saturation
    baseLightness: 0.6,
    startHueShift: -10,
    endHueShift: -5,
    startS: 0.02,  // Very low saturation at step 50
    endS: 0.02     // Very low saturation at step 950
  },
  {
    name: "zinc-500",
    baseHue: 0.6667,     // Zinc hue (similar to grey)
    baseSaturation: 0.1, // Very low saturation
    baseLightness: 0.6,
    startHueShift: 0.0,
    endHueShift: 0.0,
    startS: 0.02,  // Very low saturation at step 50
    endS: 0.02     // Very low saturation at step 950
  },
  {
    name: "neutral-500",
    baseHue: 0.0,        // Neutral hue (doesn't matter for grayscale)
    baseSaturation: 0.0, // No saturation (pure grayscale)
    baseLightness: 0.6,
    startHueShift: 0.0,
    endHueShift: 0.0,
    startS: 0.0,  // No saturation (pure grayscale)
    endS: 0.0     // No saturation (pure grayscale)
  }
];

