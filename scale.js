// scale.js
import Color from "https://colorjs.io/dist/color.js";
import { oklchToHex } from "./colors-utilities.js";
import { oklchToOKhsl, okhslToOKLCH } from "./okhsl.js";

// Export default curve settings for use in other modules
export const defaultCurves = {
  lightnessCurve: ["linear", 200, "easeInQuad", 400, "linear", 500, "linear", 600, "easeInCubic", 800, "linear"],
  saturationCurve: ["linear", 500, "linear"],
  hueCurve: ["linear", 500, "linear"]
};

/**
 * Complete set of standard easing functions
 */
function easeLinear(t) {
  return t;
}

// Sine
function easeInSine(t) {
  return 1 - Math.cos((t * Math.PI) / 2);
}

function easeOutSine(t) {
  return Math.sin((t * Math.PI) / 2);
}

function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

// Quad
function easeInQuad(t) {
  return t * t;
}

function easeOutQuad(t) {
  return 1 - (1 - t) * (1 - t);
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// Cubic
function easeInCubic(t) {
  return t * t * t;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Quart
function easeInQuart(t) {
  return t * t * t * t;
}

function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

function easeInOutQuart(t) {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

// Quint
function easeInQuint(t) {
  return t * t * t * t * t;
}

function easeOutQuint(t) {
  return 1 - Math.pow(1 - t, 5);
}

function easeInOutQuint(t) {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

// Expo
function easeInExpo(t) {
  return t === 0 ? 0 : Math.pow(2, 10 * (t - 1));
}

function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function easeInOutExpo(t) {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
}

export function ease(t, easingType = "linear") {
  switch (easingType) {
    case "linear": return easeLinear(t);
    case "easeInSine": return easeInSine(t);
    case "easeOutSine": return easeOutSine(t);
    case "easeInOutSine": return easeInOutSine(t);
    case "easeInQuad": return easeInQuad(t);
    case "easeOutQuad": return easeOutQuad(t);
    case "easeInOutQuad": return easeInOutQuad(t);
    case "easeInCubic": return easeInCubic(t);
    case "easeOutCubic": return easeOutCubic(t);
    case "easeInOutCubic": return easeInOutCubic(t);
    case "easeInQuart": return easeInQuart(t);
    case "easeOutQuart": return easeOutQuart(t);
    case "easeInOutQuart": return easeInOutQuart(t);
    case "easeInQuint": return easeInQuint(t);
    case "easeOutQuint": return easeOutQuint(t);
    case "easeInOutQuint": return easeInOutQuint(t);
    case "easeInExpo": return easeInExpo(t);
    case "easeOutExpo": return easeOutExpo(t);
    case "easeInOutExpo": return easeInOutExpo(t);
    default:
      console.warn(`Unknown easing type: ${easingType}, falling back to linear`);
      return easeLinear(t);
  }
}

/**
 * Parse curve definition and return segment information with rates
 * @param {Array} curveDefinition - Array like ["linear:0.5", 200, "easeInQuad:0.3", 400, "linear", 500]
 * @param {number} startStep - Starting step (default: 50)
 * @returns {Array} Array of segments with {easingType, rate, endStep}
 */
function parseCurveDefinition(curveDefinition, startStep = 50) {
  const segments = [];
  let currentStep = startStep;
  
  for (let i = 0; i < curveDefinition.length; i += 2) {
    const easingSpec = curveDefinition[i];
    const endStep = curveDefinition[i + 1] || 950; // Default to 950 if last segment
    
    // Parse easing type and rate (e.g., "linear:0.5" -> {type: "linear", rate: 0.5})
    let easingType, rate;
    if (easingSpec.includes(':')) {
      [easingType, rate] = easingSpec.split(':');
      rate = parseFloat(rate);
    } else {
      easingType = easingSpec;
      rate = 1.0; // Default to full rate
    }
    
    segments.push({
      startStep: currentStep,
      endStep: endStep,
      easingType: easingType,
      rate: rate
    });
    
    currentStep = endStep;
  }
  
  return segments;
}

/**
 * Evaluate a piecewise curve with separate tint and shade curves
 * @param {number} step - The step number (50, 100, 200, etc.)
 * @param {Array} tintCurve - Curve definition for tints (50→500)
 * @param {Array} shadeCurve - Curve definition for shades (500→950)
 * @param {number} startValue - Value at step 50
 * @param {number} baseValue - Value at step 500 (base)
 * @param {number} endValue - Value at step 950
 * @returns {number} The interpolated value at the given step
 */
function evaluatePiecewiseCurve(step, tintCurve, shadeCurve, startValue, baseValue, endValue) {
  const allSteps = [50, 100, 150, 200, 300, 400, 500, 600, 700, 800, 850, 900, 950];
  const stepIndex = allSteps.indexOf(step);
  if (stepIndex === -1) {
    console.warn(`Step ${step} not found in steps array`);
    return baseValue;
  }
  
  const baseIndex = allSteps.indexOf(500); // Index 6
  
  // Return base value for step 500
  if (stepIndex === baseIndex) {
    return baseValue;
  }
  
  const isInTints = stepIndex < baseIndex;
  
  if (isInTints) {
    // TINTS: Use tint curve (50→500)
    return evaluateCurveSegment(step, tintCurve, startValue, baseValue, allSteps, 0, baseIndex);
  } else {
    // SHADES: Use shade curve (500→950)
    return evaluateCurveSegment(step, shadeCurve, baseValue, endValue, allSteps, baseIndex, allSteps.length - 1);
  }
}

/**
 * Helper function to evaluate a curve segment
 */
function evaluateCurveSegment(step, curveDefinition, startValue, endValue, allSteps, startIndex, endIndex) {
  const stepIndex = allSteps.indexOf(step);
  if (!curveDefinition || curveDefinition.length === 0) {
    // Fall back to linear progression
    const t = (stepIndex - startIndex) / (endIndex - startIndex);
    return startValue + (endValue - startValue) * t;
  }

  // Parse segments
  const startStep = allSteps[startIndex];
  const segments = parseCurveDefinition(curveDefinition, startStep).map(seg => ({
    ...seg,
    startIndex: allSteps.indexOf(seg.startStep),
    endIndex: allSteps.indexOf(seg.endStep)
  }));

  // Compute total rate
  const totalRate = segments.reduce((sum, seg) => sum + seg.rate, 0);

  let accumulatedRate = 0;
  for (const segment of segments) {
    const segSpan = segment.endIndex - segment.startIndex;
    if (stepIndex >= segment.startIndex && stepIndex <= segment.endIndex) {
      // Step is in this segment
      const localT = segSpan === 0 ? 0 : (stepIndex - segment.startIndex) / segSpan;
      const easedT = ease(localT, segment.easingType);
      // Progress up to this segment
      const progressBefore = accumulatedRate / totalRate;
      // Progress within this segment
      const progressInSeg = (segment.rate / totalRate) * easedT;
      const progress = progressBefore + progressInSeg;
      return startValue + (endValue - startValue) * progress;
    }
    accumulatedRate += segment.rate;
  }

  // If not found, return endValue
  return endValue;
}

function wrapHue(h) {
  return ((h % 360) + 360) % 360;
}

// Old generateTintShadeScale function removed - replaced by generatePerceptuallyUniformScale with piecewise curves

/**
 * generatePerceptuallyUniformScale using OKhsl with piecewise curves
 * Uses OKhsl color space to ensure perceptually uniform saturation across different hues
 * 
 * @param {Object} options - Configuration object
 * @param {number} options.baseL - Base lightness (OKLCH L, 0-100)
 * @param {number} options.baseC - Base chroma (OKLCH C, 0-0.4ish)
 * @param {number} options.baseH - Base hue (OKLCH H, 0-360)
 * @param {number} options.startL - Lightness at step 50
 * @param {number} options.endL - Lightness at step 950
 * @param {number} options.startS - Saturation at step 50 (0-1)
 * @param {number} options.endS - Saturation at step 950 (0-1)
 * @param {number} options.startHueShift - Hue shift at step 50 (degrees)
 * @param {number} options.endHueShift - Hue shift at step 950 (degrees)
 * @param {Array} [options.lightnessCurve] - Piecewise curve for lightness progression
 * @param {Array} [options.saturationCurve] - Piecewise curve for saturation progression
 * @param {Array} [options.hueCurve] - Piecewise curve for hue progression
 * @returns {Array} Array of 13 color objects {L, C, H}
 */
export function generatePerceptuallyUniformScale({
  baseL,
  baseC,
  baseH,
  startL,
  endL,
  startS,
  endS,
  startHueShift,
  endHueShift,
  // New separate curves
  tintLightnessCurve = defaultCurves.tintLightnessCurve,
  tintSaturationCurve = defaultCurves.tintSaturationCurve,
  tintHueCurve = defaultCurves.tintHueCurve,
  shadeLightnessCurve = defaultCurves.shadeLightnessCurve,
  shadeSaturationCurve = defaultCurves.shadeSaturationCurve,
  shadeHueCurve = defaultCurves.shadeHueCurve,
  // Legacy support
  lightnessCurve = null,
  saturationCurve = null,
  hueCurve = null
}) {
  const steps = [50, 100, 150, 200, 300, 400, 500, 600, 700, 800, 850, 900, 950];
  const N = steps.length;
  const scale = new Array(N);

  // Convert base color to OKhsl to get reference saturation
  const baseOKhsl = oklchToOKhsl(baseL, baseC, baseH);
  const baseSaturation = baseOKhsl.s;

  // Generate each step
  for (let i = 0; i < N; i++) {
    const step = steps[i];
    
    if (step === 500) {
      scale[i] = { L: baseL, C: baseC, H: baseH };
      continue;
    }

    // Use separate curves for tints vs shades
    const Li = evaluatePiecewiseCurve(step, tintLightnessCurve, shadeLightnessCurve, startL, baseL, endL);
    const Si = evaluatePiecewiseCurve(step, tintSaturationCurve, shadeSaturationCurve, startS, baseSaturation, endS);
    const hueShift = evaluatePiecewiseCurve(step, tintHueCurve, shadeHueCurve, startHueShift, 0, endHueShift);
    const Hi = wrapHue(baseH + hueShift);

    // Handle zero saturation case (pure grayscale)
    let Ci;
    if (Si === 0 || isNaN(Si)) {
      Ci = 0;
    } else {
      const tempOklch = okhslToOKLCH(Hi / 360, Si, baseOKhsl.l);
      Ci = tempOklch.C;
      if (isNaN(Ci)) {
        Ci = 0;
      }
    }

    scale[i] = { L: Li, C: Ci, H: Hi };
  }

  return scale;
}


