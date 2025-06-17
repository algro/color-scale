// colors.js

import { generateTintShadeScale } from "./scale.js";
import Color from "https://colorjs.io/dist/color.js";

// 1) Export stepsCount (odd integer, e.g. 11, 13, 15…)
export const stepsCount = 13;


export const defaults = {
  // Lightness at step 50 (0…100)
  startL:   98,  
  // Lightness at step 950 (0…100)
  endL:     19,  
  // Tint saturation progression (0-1) - from step 50 to base-500
  tintStartS: 0.1,    // Saturation at tint-50 (lightest)
  tintEndS:   0.9,    // Saturation approaching base-500 (without affecting base-500)
  
  // Shade saturation progression (0-1) - from base-500 to step 950  
  shadeStartS: 0.85,   // Saturation starting from base-500 (without affecting base-500)
  shadeEndS:   0.3,   // Saturation at shade-950 (darkest)    

  // Rate of progression for tints and shades (0-1)
  tintRate: 1.0,    // How much of the way to base-500 the tints reach (1.0 = 100%)
  shadeRate: 1.0,   // How much of the way to endL the shades reach (1.0 = 100%)

  // Note: Uses OKhsl color space for perceptually uniform saturation across all hues.
  // Bezier curves control lightness and hue progression for smooth transitions.
};

// 3) Export your array of colorConfigs. Any per-color override for L/C
//    must follow the same ranges: L in 0..100, C in 0..0.4.
export const colorConfigs = [
  {
    name: "red-500",
    baseHex: "#F23441",
    startHueShift: -8.0,
    endHueShift:    -5,
    shadeStartS: 0.9
  },
  {
    name: "orange-500",
    baseHex: "#f67b29",
    startHueShift: 26,
    endHueShift:   -8,
    shadeStartS: 0.95
  },
  {
    name: "amber-500",
    baseHex: "#F5A314",
    startHueShift: 20,
    endHueShift:   -25,
    shadeStartS: 0.95
    
  },
  {
    name: "yellow-500",
    baseHex: "#FAB905",
    startHueShift: 15,
    endHueShift:   -32,
    shadeStartS: 0.9
    
  },
  {
    name: "olive-500",
    baseHex: "#C5C020",
    startHueShift: 0,
    endHueShift:   -5,
    shadeStartS: 0.9
    
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
    endHueShift:    0,
    
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
    endHueShift:    -12,
    shadeStartS: 0.9
  },
  {
    name: "sand-500",
    baseHex: "#99615C",
    startHueShift: 10.0,
    endHueShift: -20.0,
    tintStartS: 0.02,   // Low saturation at tint-50
    tintEndS: 0.3,     // Moderate saturation approaching base-500
    shadeStartS: 0.4,  // Moderate saturation starting from base-500
    shadeEndS: 0.04     // Low saturation at shade-950
  },
  {
    name: "slate-500",
    baseHex: "#636F88",
    startHueShift: -8.0,
    endHueShift: 8.0,
    tintStartS: 0.02,   // Low saturation at tint-50
    tintEndS: 0.22,     // Moderate saturation approaching base-500
    shadeStartS: 0.22,  // Higher saturation starting from base-500
    shadeEndS: 0.04     // Maintain higher saturation at shade-950
  },
  {
    name: "grey-500",
    baseHex: "#68686E",
    startHueShift: 0.0,
    endHueShift: 0.0,
    tintStartS: 0.02,  // Very low saturation at tint-50
    tintEndS: 0.022,    // Still very low saturation approaching base-500
    shadeStartS: 0.045,  // Low saturation starting from base-500
    shadeEndS: 0.02     // Higher saturation at shade-950
  },
  {
    name: "neutral-500",
    baseHex: "#686868",
    startHueShift: 0.0,
    endHueShift: 0.0,
    tintStartS: 0.0,   // No saturation (pure grayscale)
    tintEndS: 0.0,     // No saturation (pure grayscale)
    shadeStartS: 0.0,  // No saturation (pure grayscale)
    shadeEndS: 0.0     // No saturation (pure grayscale)
  }
];

