// scale.js
import Color from "https://colorjs.io/dist/color.js";
import { oklchToHex } from "./colors-utilities.js";
import { oklchToOKhsl, okhslToOKLCH } from "./okhsl.js";

/**
 * Easing function that takes a string name and returns the appropriate curve
 * @param {number} t - progress value from 0 to 1
 * @param {string} easingType - one of: "linear", "bezierTint-11", "bezierTint-13", "bezierShade-11", "bezierShade-13"
 * @returns {number} - eased value from 0 to 1
 */
// Cubic bezier implementation - matches CSS cubic-bezier() exactly
function cubicBezier(t, x1, y1, x2, y2) {
  // For cubic bezier curve with control points (x1,y1) and (x2,y2)
  // Start point is (0,0), end point is (1,1)
  
  // Use binary search to find the correct t value for given x
  function bezierX(t) {
    return 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
  }
  
  function bezierY(t) {
    return 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
  }
  
  // Binary search to find t that gives us the input x
  let start = 0, end = 1, mid;
  const precision = 0.0001;
  
  for (let i = 0; i < 20; i++) {
    mid = (start + end) / 2;
    const x = bezierX(mid);
    
    if (Math.abs(x - t) < precision) break;
    
    if (x < t) {
      start = mid;
    } else {
      end = mid;
    }
  }
  
  return bezierY(mid);
}

export function ease(t, easingType = "easeInSine") {
  switch (easingType) {
    case "linear":
      return t;
    
    case "bezierTint":
      // cubic-bezier(0.6, 0.2, 0.75, 1.0) - gentle start, strong acceleration at end
      return cubicBezier(t, 0.8, 0.05, 0.6, 0.75);
    
    case "bezierShade":
      // Modified to create S-shaped curve with brighter middle section:
      // - First control point (0.6, 0.1) maintains gentle start
      // - Second control point (0.3, 0.5) lifts the middle section
      return cubicBezier(t, 0.7, 0.075, 0.3, 0.5);
    
    case "bezierTintHue":
    case "bezierShadeHue":
      // Perfectly linear curve for hue in both tints and shades
      return t;
    
    case "bezierTintSaturation":
      // Tint saturation curve - slower acceleration, later deceleration
      // cubic-bezier(0.6, 0.1, 0.65, 1.0) - between harmonic and lightness curve
      return cubicBezier(t, 0.6, 0.1, 0.65, 1.0);
    
    case "bezierShadeSaturation":
      // Shade saturation curve - harmonic curve with equal acceleration/deceleration
      // cubic-bezier(0.4, 0.0, 0.6, 1.0) - smooth S-curve with balanced transitions
      return cubicBezier(t, 0.4, 0.0, 0.6, 1.0);
    
    default:
      console.warn(`Unknown easing type: ${easingType}, falling back to easeInSine`);
      return 1 - Math.cos((t * Math.PI) / 2);
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
  
  // Use consistent curves regardless of step count
  const tintCurve = "bezierTint";
  const shadeCurve = "bezierShade";
  const tintHueCurve = "bezierTintHue";
  const shadeHueCurve = "bezierShadeHue";

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
    const eL = ease(t, tintCurve);
    const eH = ease(t, tintHueCurve);

    // Calculate lightness and hue progression directly in OKLCH space
    const Li = startL + (baseL - startL) * eL;
    const Hi = H0 + startHueShift * (1 - eH);
    
    // Calculate saturation progression using tint-specific bezier curve, then convert to chroma
    const eS = ease(t, "bezierTintSaturation");  // Use tint curve with slower acceleration, later deceleration
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
    const eL = ease(adjustedT, shadeCurve);
    const eH = ease(t, shadeHueCurve);
    
    // Calculate lightness and hue progression directly in OKLCH space
    const Li = baseL - (baseL - endL) * eL;
    const Hi = H0 + endHueShift * eH;
    
    // Calculate saturation progression using shade-specific bezier curve, then convert to chroma
    const eS = ease(t, "bezierShadeSaturation");  // Use harmonic curve for smooth saturation transitions
    const Si = shadeStartS + (shadeEndS - shadeStartS) * eS;
    
    // Convert only saturation through OKhsl to get chroma, preserve our lightness
    const tempOklch = okhslToOKLCH(Hi / 360, Si, baseOKhsl.l);  // Use base lightness for conversion
    const Ci = tempOklch.C;  // Extract the chroma
    
    // Use our calculated lightness, OKhsl-derived chroma, and our calculated hue
    scale[i] = { L: Li, C: Ci, H: wrapHue(Hi) };
  }

  return scale;
}


