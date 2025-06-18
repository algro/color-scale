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
  saturationCurve: ["linear:0.12", 150, "easeInOutSine:0.88", 500, "easeInOutSine:0.78",850,"linear:0.22"],
  hueCurve: ["linear", 500, "linear"],

  // Note: Uses OKhsl color space for perceptually uniform saturation across all hues.
  // Piecewise curves control lightness, saturation, and hue progression for maximum flexibility.
};

// 3) Export your array of colorConfigs. Any per-color override for L/C
//    must follow the same ranges: L in 0..100, C in 0..0.4.
export const colorConfigs = [
  {
    name: "red-500", 
    baseHex: "#F23441",
    startHueShift: -8.0,
    endHueShift: -5,
    // Example: Custom saturation curve for red with rates
    // saturationCurve: ["easeOutQuad:0.4", 300, "linear:0.3", 500, "linear", 700, "easeInCubic:0.5"]
  },
  {
    name: "orange-500",
    baseHex: "#f67b29",
    startHueShift: 26,
    endHueShift:   -8
  },
  {
    name: "amber-500",
    baseHex: "#F5A314",
    startHueShift: 20,
    endHueShift:   -25
  },
  {
    name: "yellow-500",
    baseHex: "#FAB905",
    startHueShift: 15,
    endHueShift:   -32
  },
  {
    name: "olive-500",
    baseHex: "#C5C020",
    startHueShift: 0,
    endHueShift:   -5
  },
  {
    name: "lime-500",
    baseHex: "#9BC61C",
    startHueShift: -10,
    endHueShift:    5
  },
  {
    name: "green-500",
    baseHex: "#01C15B",
    startHueShift: -10,
    endHueShift:    12
  },
  {
    name: "emerald-500",
    baseHex: "#0cbc7d",
    startHueShift:  0,
    endHueShift:   12
  },
  {
    name: "teal-500",
    baseHex: "#14b8a6",
    startHueShift: -5,
    endHueShift:   5.0
  },
  {
    name: "cyan-500",
    baseHex: "#00B8DB",
    startHueShift: -5,
    endHueShift:   -2
  },
  {
    name: "sky-500",
    baseHex: "#00A6F4",
    startHueShift:  -5,
    endHueShift:    0
  },
  {
    name: "blue-500",
    baseHex: "#3d88fd",
    startHueShift:  -5,
    endHueShift:     5
  },
  {
    name: "indigo-500",
    baseHex: "#5766fc",
    startHueShift:  -5,
    endHueShift:     0
  },
  {
    name: "iris-500",
    baseHex: "#6D4AFF",
    startHueShift:  -5,
    endHueShift:     7
  },
  {
    name: "violet-500",
    baseHex: "#8E51FF",
    startHueShift:  -5.0,
    endHueShift:    5.0
  },
  {
    name: "purple-500",
    baseHex: "#ad48fe",
    startHueShift:   4.5,
    endHueShift:    -1.2
  },
  {
    name: "fuchsia-500",
    baseHex: "#D641EC",
    startHueShift:  -2.5,
    endHueShift:     3.5
  },
  {
    name: "pink-500",
    baseHex: "#F53DA5",
    startHueShift: -5,
    endHueShift:    3
  },
  {
    name: "rose-500",
    baseHex: "#EE3A59",
    startHueShift:  -4.0,
    endHueShift:    -12
  },
  {
    name: "sand-500",
    baseHex: "#99615C",
    startHueShift: 10.0,
    endHueShift: -20.0,
    startS: 0.02,  // Low saturation at step 50
    endS: 0.04     // Low saturation at step 950
  },
  {
    name: "slate-500",
    baseHex: "#617085",
    startHueShift: -8.0,
    endHueShift: 8.0,
    startS: 0.02,  // Low saturation at step 50
    endS: 0.04     // Low saturation at step 950
  },
  {
    name: "grey-500",
    baseHex: "#636A79",
    startHueShift: -10,
    endHueShift: -5,
    startS: 0.02,  // Very low saturation at step 50
    endS: 0.02     // Very low saturation at step 950
  },
  {
    name: "zinc-500",
    baseHex: "#67676F",
    startHueShift: 0.0,
    endHueShift: 0.0,
    startS: 0.02,  // Very low saturation at step 50
    endS: 0.02     // Very low saturation at step 950
  },
  {
    name: "neutral-500",
    baseHex: "#686868",
    startHueShift: 0.0,
    endHueShift: 0.0,
    startS: 0.0,  // No saturation (pure grayscale)
    endS: 0.0     // No saturation (pure grayscale)
  }
];

