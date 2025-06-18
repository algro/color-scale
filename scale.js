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
 * @returns {Array} Array of segments with {easingType, rate, endStep}
 */
function parseCurveDefinition(curveDefinition) {
  const segments = [];
  let currentStep = 50; // Always start at step 50
  
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
 * Evaluate a piecewise curve with cascading progression and adjustable rates
 * @param {number} step - The step number (50, 100, 200, etc.)
 * @param {Array} curveDefinition - The curve definition array with rates
 * @param {number} startValue - Value at step 50
 * @param {number} baseValue - Value at step 500 (base)
 * @param {number} endValue - Value at step 950
 * @returns {number} The interpolated value at the given step
 */
function evaluatePiecewiseCurve(step, curveDefinition, startValue, baseValue, endValue) {
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
  
  // Parse segments with rates
  const segments = parseCurveDefinition(curveDefinition).map(seg => ({
    ...seg,
    startIndex: allSteps.indexOf(seg.startStep),
    endIndex: allSteps.indexOf(seg.endStep)
  }));
  
  const isInTints = stepIndex < baseIndex;
  
  if (isInTints) {
    // TINTS: Only consider segments that affect the tint range (50→500)
    const tintSegments = segments.filter(seg => seg.endIndex <= baseIndex);
    
    let currentValue = 0;
    for (const segment of tintSegments) {
      if (stepIndex < segment.startIndex) break;
      
      let segmentCompletion;
      if (stepIndex >= segment.endIndex) {
        segmentCompletion = 1.0;
      } else {
        segmentCompletion = (stepIndex - segment.startIndex) / (segment.endIndex - segment.startIndex);
      }
      
      const easedCompletion = ease(segmentCompletion, segment.easingType);
      currentValue += segment.rate * easedCompletion;
      
      if (stepIndex <= segment.endIndex) break;
    }
    
    const progressRatio = Math.min(currentValue, 1.0);
    return startValue + (baseValue - startValue) * progressRatio;
    
  } else {
    // SHADES: Only consider segments that affect the shade range (500→950)
    const shadeSegments = segments.filter(seg => seg.startIndex >= baseIndex);
    
    // If no shade segments defined, fall back to linear progression
    if (shadeSegments.length === 0) {
      const t = (stepIndex - baseIndex) / (allSteps.length - 1 - baseIndex);
      return baseValue + (endValue - baseValue) * t;
    }
    
    let currentValue = 0;
    for (const segment of shadeSegments) {
      if (stepIndex < segment.startIndex) break;
      
      let segmentCompletion;
      if (stepIndex >= segment.endIndex) {
        segmentCompletion = 1.0;
      } else {
        segmentCompletion = (stepIndex - segment.startIndex) / (segment.endIndex - segment.startIndex);
      }
      
      const easedCompletion = ease(segmentCompletion, segment.easingType);
      currentValue += segment.rate * easedCompletion;
      
      if (stepIndex <= segment.endIndex) break;
    }
    
    const progressRatio = Math.min(currentValue, 1.0);
    return baseValue + (endValue - baseValue) * progressRatio;
  }
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
  lightnessCurve = defaultCurves.lightnessCurve,
  saturationCurve = defaultCurves.saturationCurve,
  hueCurve = defaultCurves.hueCurve
}) {
  const steps = [50, 100, 150, 200, 300, 400, 500, 600, 700, 800, 850, 900, 950];
  const N = steps.length; // Always 13 steps
  const scale = new Array(N);

  // Convert base color to OKhsl to get reference saturation
  const baseOKhsl = oklchToOKhsl(baseL, baseC, baseH);
  const baseSaturation = baseOKhsl.s;

  // Generate each step
  for (let i = 0; i < N; i++) {
    const step = steps[i];
    
    if (step === 500) {
      // Base color unchanged
      scale[i] = { L: baseL, C: baseC, H: baseH };
      continue;
    }

    // Evaluate curves at this step
    const Li = evaluatePiecewiseCurve(step, lightnessCurve, startL, baseL, endL);
    const Si = evaluatePiecewiseCurve(step, saturationCurve, startS, baseSaturation, endS);
    const hueShift = evaluatePiecewiseCurve(step, hueCurve, startHueShift, 0, endHueShift);
    const Hi = wrapHue(baseH + hueShift);

    // Handle zero saturation case (pure grayscale)
    let Ci;
    if (Si === 0 || isNaN(Si)) {
      Ci = 0; // Zero chroma for grayscale
    } else {
      // Convert saturation through OKhsl to get chroma
      const tempOklch = okhslToOKLCH(Hi / 360, Si, baseOKhsl.l);
      Ci = tempOklch.C;
      
      // Fallback if OKhsl conversion produces NaN
      if (isNaN(Ci)) {
        Ci = 0;
      }
    }

    // Use calculated lightness, OKhsl-derived chroma, and calculated hue
    scale[i] = { L: Li, C: Ci, H: Hi };
  }

  return scale;
}


