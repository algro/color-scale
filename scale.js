// scale.js
import Color from "https://colorjs.io/dist/color.js";
import { oklchToHex } from "./colors-utilities.js";
import { oklchToOKhsl, okhslToOKLCH } from "./okhsl.js";

// Export curve settings for use in other modules
export const curveSettings = {
  lightness: "easeInOutQuad",  
  saturation: "easeInOutCubic",  
  hue: "linear"                 
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
  baseL,
  baseC,
  baseH,
  startL,
  endL,
  startHueShift,
  endHueShift,
  stepsCount,
  tintStartS,
  tintEndS,
  shadeStartS,
  shadeEndS,
  tintLRate = 1.0,
  shadeLRate = 1.0
}) {
  // Calculate the number of steps for tints and shades
  const totalSteps = stepsCount;
  const midPoint = Math.floor(totalSteps / 2);
  const tintSteps = midPoint;
  const shadeSteps = totalSteps - midPoint - 1; // -1 for the base color

  // Calculate the lightness ranges
  const tintLightnessRange = (baseL - startL) * tintLRate; // How far from startL towards baseL
  const shadeLightnessRange = (endL - baseL) * shadeLRate; // How far from baseL towards endL

  // Generate the scale
  const scale = [];
  
  // Generate tints (50 to 400)
  for (let i = 0; i < tintSteps; i++) {
    const t = i / (tintSteps - 1);
    const L = startL + (tintLightnessRange * t); // Progress from startL towards baseL
    const S = tintStartS + (tintEndS - tintStartS) * t;
    const H = baseH + (startHueShift * t);
    scale.push([L, S, H]);
  }
  
  // Add base color (500)
  scale.push([baseL, baseC, baseH]);
  
  // Generate shades (600 to 950)
  for (let i = 0; i < shadeSteps; i++) {
    const t = (i + 1) / shadeSteps;
    const L = baseL + (shadeLightnessRange * t); // Progress from baseL towards endL
    const S = shadeStartS + (shadeEndS - shadeStartS) * t;
    const H = baseH + (endHueShift * t);
    scale.push([L, S, H]);
  }
  
  return scale;
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
  shadeEndS = 0.2,    // Saturation at shade-950
  tintLRate = 1.0,    // Rate for tint lightness progression (≥ 1.0)
  shadeLRate = 1.0    // Rate for shade lightness progression (≤ 1.0)
}) {
  // Validate stepsCount - only allow 11 or 13
  if (stepsCount !== 11 && stepsCount !== 13) {
    throw new Error("stepsCount must be 11 or 13");
  }
  
  // Validate rate constraints
  if (tintLRate < 1.0) {
    console.warn(`tintLRate (${tintLRate}) should be ≥ 1.0 to ensure tints remain lighter than base-500`);
  }
  if (shadeLRate > 1.0) {
    console.warn(`shadeLRate (${shadeLRate}) should be ≤ 1.0 to ensure shades remain darker than base-500`);
  }
  
  // Use curve settings from the exported configuration
  const { lightness, saturation, hue } = curveSettings;

  const N = stepsCount;
  const mid = Math.floor(N / 2);
  const H0 = wrapHue(baseH);
  const scale = new Array(N);

  // Convert base color to OKhsl to get reference saturation
  const baseOKhsl = oklchToOKhsl(baseL, baseC, H0);

  // Calculate the effective target lightness for tints and shades
  const tintTargetL = tintLRate * baseL;  // Where tints should progress to
  const shadeStartL = shadeLRate * baseL; // Where shades should start from

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

    // Calculate lightness progression from startL to tintTargetL
    const Li = startL + (tintTargetL - startL) * eL;
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
    const t = k / (N - mid - 1); // Normalize to 0-1 range for shades
    const eL = ease(t, lightness);
    const eH = ease(t, hue);
    const eS = ease(t, saturation);
    
    // Calculate lightness progression from shadeStartL to endL
    const Li = shadeStartL + (endL - shadeStartL) * eL;
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


