// scale.js
import Color from "https://colorjs.io/dist/color.js";
import { oklchToHex } from "./colors-utilities.js";
import { oklchToOKhsl, okhslToOKLCH } from "./okhsl.js";

// Export curve settings for use in other modules
export const curveSettings = {
  lightness: "easeInOutCubic",  // Quint for lightness
  saturation: "easeInOutQuad",  // Gentle S-curve for saturation
  hue: "linear"                 // Linear for hue shifts
};

/**
 * Easing function that takes a string name and returns the appropriate curve
 * @param {number} t - progress value from 0 to 1
 * @param {string} easingType - one of: "linear", "bezierTint-11", "bezierTint-13", "bezierShade-11", "bezierShade-13"
 * @returns {number} - eased value from 0 to 1
 */
// Standard easing functions - faster and more predictable than Bézier curves
function easeLinear(t) {
  return t;
}

function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeInOutQuart(t) {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

function easeInOutQuint(t) {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

export function ease(t, easingType = "easeInOutSine") {
  switch (easingType) {
    case "linear":
      return easeLinear(t);
    
    case "easeInOutSine":
      return easeInOutSine(t);
    
    case "easeInOutQuad":
      return easeInOutQuad(t);
    
    case "easeInOutCubic":
      return easeInOutCubic(t);
    
    case "easeInOutQuart":
      return easeInOutQuart(t);
    
    case "easeInOutQuint":
      return easeInOutQuint(t);
    
    default:
      console.warn(`Unknown easing type: ${easingType}, falling back to linear`);
      return easeLinear(t);
  }
}

function wrapHue(h) {
  return ((h % 360) + 360) % 360;
}



/**
 * generateTintShadeScale(options):
 *
 *   - baseL, baseC, baseH:       The "500" color in (L ∈ 0..100, C ∈ 0..0.4, H ∈ deg).
 *   - startL, startHueShift:    The (L,H-shift) for step 50.
 *   - endL, endHueShift:        The (L,H-shift) for step 950.
 *   - stepsCount:               Must be 11 or 13 steps only.
 *   - tintStartS, tintEndS:     OKhsl saturation range (0-1) for tints (50 → 500).
 *   - shadeStartS, shadeEndS:   OKhsl saturation range (0-1) for shades (500 → 950).
 *
 * Uses OKhsl color space for perceptually uniform saturation across all hues.
 * Bezier curves control lightness, hue, and saturation progression.
 * Saturation uses a harmonic curve with equal acceleration/deceleration for smooth transitions.
 *
 * Returns an array of length stepsCount of objects {L, C, H}, each guaranteed
 * to lie within the sRGB gamut through OKhsl's built-in gamut mapping.
 */
export function generateTintShadeScale({
  baseL, baseC, baseH,
  startL, startHueShift,
  endL, endHueShift,
  stepsCount,
  tintStartS = 0.1,   // Saturation at tint-50
  tintEndS = 0.5,     // Saturation approaching base-500
  shadeStartS = 0.9,  // Saturation starting from base-500
  shadeEndS = 0.2     // Saturation at shade-950
}) {
  return generatePerceptuallyUniformScale({
    baseL, baseC, baseH,
    startL, startHueShift,
    endL, endHueShift,
    stepsCount,
    tintStartS,
    tintEndS,
    shadeStartS,
    shadeEndS
  });
}

/**
 * generatePerceptuallyUniformScale using OKhsl
 * Uses OKhsl color space to ensure perceptually uniform saturation across different hues
 */
export function generatePerceptuallyUniformScale({
  baseL, baseC, baseH,
  startL, startHueShift,
  endL, endHueShift,
  stepsCount,
  tintStartS = 0.1,   // Saturation at tint-50
  tintEndS = 0.5,     // Saturation approaching base-500
  shadeStartS = 0.9,  // Saturation starting from base-500
  shadeEndS = 0.2     // Saturation at shade-950
}) {
  // Validate stepsCount - only allow 11 or 13
  if (stepsCount !== 11 && stepsCount !== 13) {
    throw new Error("stepsCount must be 11 or 13");
  }
  
  // Use curve settings from the exported configuration
  const { lightness, saturation, hue } = curveSettings;

  const N = stepsCount;
  const mid = Math.floor(N / 2);
  const H0 = wrapHue(baseH);
  const scale = new Array(N);

  // Convert base color to OKhsl to get reference saturation
  const baseOKhsl = oklchToOKhsl(baseL, baseC, H0);

  // Generate tints (lighter colors)
  for (let i = 0; i <= mid; i++) {
    if (i === mid) {
      scale[i] = { L: baseL, C: baseC, H: H0 };
      continue;
    }
    const t = i / mid;
    const eL = ease(t, lightness);
    const eH = ease(t, hue);
    const eS = ease(t, saturation);

    // Calculate lightness and hue progression directly in OKLCH space
    const Li = startL + (baseL - startL) * eL;
    const Hi = H0 + startHueShift * (1 - eH);
    
    // Calculate saturation progression
    const Si = tintStartS + (tintEndS - tintStartS) * eS;
    
    // Convert only saturation through OKhsl to get chroma, preserve our lightness
    const tempOklch = okhslToOKLCH(Hi / 360, Si, baseOKhsl.l);  // Use base lightness for conversion
    const Ci = tempOklch.C;  // Extract the chroma
    
    // Use our calculated lightness, OKhsl-derived chroma, and our calculated hue
    scale[i] = { L: Li, C: Ci, H: wrapHue(Hi) };
  }

  // Generate shades (darker colors)
  for (let i = mid + 1; i < N; i++) {
    const k = i - mid;
    const t = k / mid;
    const adjustedT = t < 0.2 
      ? t * 2
      : 0.4 + (t - 0.2) * 0.75;
    const eL = ease(adjustedT, lightness);
    const eH = ease(t, hue);
    const eS = ease(t, saturation);
    
    // Calculate lightness and hue progression directly in OKLCH space
    const Li = baseL - (baseL - endL) * eL;
    const Hi = H0 + endHueShift * eH;
    
    // Calculate saturation progression
    const Si = shadeStartS + (shadeEndS - shadeStartS) * eS;
    
    // Convert only saturation through OKhsl to get chroma, preserve our lightness
    const tempOklch = okhslToOKLCH(Hi / 360, Si, baseOKhsl.l);  // Use base lightness for conversion
    const Ci = tempOklch.C;  // Extract the chroma
    
    // Use our calculated lightness, OKhsl-derived chroma, and our calculated hue
    scale[i] = { L: Li, C: Ci, H: wrapHue(Hi) };
  }

  return scale;
}


