// app.js
import Color from "https://colorjs.io/dist/color.js";
import { generatePerceptuallyUniformScale, ease } from "./scale.js";
import { defaults, colorConfigs, stepsCount, calculateSaturationRange } from "./colors.js";
import { computeContrastDotColor, rgbToOklab, oklchToHex } from "./colors-utilities.js";
import { okhslToOKLCH } from "./okhsl.js";

// Note: --swatch-count is now handled in generateGlobalColorsCss()

// Global storage for all generated color scales
window.allColorScales = [];

// Theme management
let currentTheme = 'slate';

window.useOklab = false;
window.addEventListener("keydown", (e) => {
  if (e.key === "Shift" && !e.repeat) {
    window.useOklab = !window.useOklab;
  }
});

// Always use 13 steps: 50, 100, 150, 200, 300, 400, 500, 600, 700, 800, 850, 900, 950
function getStepsForCurrentCount() {
  return [50, 100, 150, 200, 300, 400, 500, 600, 700, 800, 850, 900, 950];
}

function getStepNameForIndex(colorName, stepIndex) {
  const steps = getStepsForCurrentCount();
  return `${colorName}-${steps[stepIndex]}`;
}

// Note: Swatch count is now handled in generateGlobalColorsCss()

function createScaleRow({
  name,
  baseHue,
  baseSaturation,
  baseLightness,
  startHueShift,
  endHueShift,
  startL: cfgStartL,
  endL:   cfgEndL,
  ...overrides
}, rowIndex) {
  // Always use 13 steps
  // Convert OKhsl base values to OKLCH coords:
  const baseOKLCH = okhslToOKLCH(baseHue, baseSaturation, baseLightness);
  const baseL = baseOKLCH.L;   // Already in 0-100 range
  const baseC = baseOKLCH.C;   // Already in 0-0.4 range
  const baseH = baseOKLCH.H;   // Already in 0-360 range

  // Auto-derive startS and endS if not explicitly overridden
  let startS, endS;
  if (overrides.startS !== undefined && overrides.endS !== undefined) {
    // Use explicit overrides
    startS = overrides.startS;
    endS = overrides.endS;
  } else {
    // Calculate based on baseSaturation using percentage-based approach
    const calculated = calculateSaturationRange(baseSaturation);
    startS = overrides.startS ?? calculated.startS;
    endS = overrides.endS ?? calculated.endS;
  }

  // Build the "options" object:
  const options = {
    baseL,
    baseC,
    baseH,
    startL: cfgStartL ?? defaults.startL,
    endL:   cfgEndL ?? defaults.endL,
    startS,
    endS,
    startHueShift,
    endHueShift,
    // Curve overrides (use defaults if not specified)
    lightnessCurve:  overrides.lightnessCurve  ?? defaults.lightnessCurve,
    saturationCurve: overrides.saturationCurve ?? defaults.saturationCurve,
    hueCurve:        overrides.hueCurve        ?? defaults.hueCurve,
  };

  const fullScaleLCH = generatePerceptuallyUniformScale(options);
  const fullScaleHex = fullScaleLCH.map(oklchToHex);
  
  // Store this scale's data globally
  window.allColorScales.push({
    name: name,
    hexValues: fullScaleHex,
    lchValues: fullScaleLCH,
    config: { name, baseHue, baseSaturation, baseLightness, startHueShift, endHueShift, startL: cfgStartL, endL: cfgEndL, ...overrides }
  });

  const row = document.createElement("div");
  row.className = "column scale-row";

  const swatchContainer = document.createElement("div");
  swatchContainer.className = "swatch-container";

  const colorName = name.split("-")[0]; // Extract base color name (e.g., "red" from "red-500")

  fullScaleHex.forEach((hex, idx) => {
    const sw = document.createElement("div");
    sw.className = "swatch";
    sw.style.backgroundColor = hex;
    // Store the actual OKLCh triple on the element:
    sw.__oklchCoords = fullScaleLCH[idx];

    const tooltip = document.createElement("div");
    tooltip.className = "tooltip";

    const contrastDot = document.createElement("div");
    contrastDot.className = "contrast-dot";
    contrastDot.style.backgroundColor = computeContrastDotColor(hex);

    sw.appendChild(tooltip);
    sw.appendChild(contrastDot);

    sw.addEventListener("mouseenter", () => {
      const stepName = getStepNameForIndex(colorName, idx);
      if (window.useOklab) {
        const { L, C, H } = sw.__oklchCoords;
        const Lpct = L.toFixed(1) + '%';
        tooltip.textContent = `${stepName} oklch(${Lpct} ${C.toFixed(3)} ${H.toFixed(1)})`;
      } else {
        tooltip.textContent = `${stepName} ${hex}`;
      }
    });
    sw.addEventListener("mouseleave", () => {
      tooltip.textContent = "";
    });
    sw.addEventListener("click", async () => {
      const toCopy = window.useOklab
        ? (()=>{
            const { L, C, H } = sw.__oklchCoords;
            const Lpct = L.toFixed(1) + '%';
            return `oklch(${Lpct} ${C.toFixed(3)} ${H.toFixed(1)})`;
          })()
        : hex;
      await navigator.clipboard.writeText(toCopy);
      
      // Show touch pill on touch devices
      showTouchColorPill(hex);
      
      // Show confirmation message
      tooltip.textContent = "Copied to clipboard!";
      setTimeout(() => {
        // Restore original color value with step name
        const stepName = getStepNameForIndex(colorName, idx);
        tooltip.textContent = window.useOklab
          ? (()=>{
              const { L, C, H } = sw.__oklchCoords;
              const Lpct = L.toFixed(1) + '%';
              return `${stepName} oklch(${Lpct} ${C.toFixed(3)} ${H.toFixed(1)})`;
            })()
          : `${stepName} ${hex}`;
      }, 1000);
    });

    swatchContainer.appendChild(sw);
  });

  row.appendChild(swatchContainer);
  
  return row;
}

// Dark mode toggle functionality
function initDarkMode() {
  // Check for saved theme preference or default to dark mode
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  // Add click handler for dark mode toggle
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  darkModeToggle.addEventListener('click', toggleDarkMode);
}

function toggleDarkMode() {
  const currentDarkMode = document.documentElement.getAttribute('data-theme');
  const newDarkMode = currentDarkMode === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newDarkMode);
  localStorage.setItem('theme', newDarkMode);
}

// Initialize dark mode
initDarkMode();

// Tab switching removed - always use 13 steps

// Function to generate CSS content for all color scales
function generateGlobalColorsCss() {
  // Get or create the style element for generated colors
  let styleElement = document.getElementById('generated-colors');
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'generated-colors';
    document.head.appendChild(styleElement);
  }
  
  // Build CSS content with all color variables
  let cssContent = ':root {\n';
  cssContent += `  --swatch-count: ${window.allColorScales[0]?.hexValues.length || 13};\n`;
  
  window.allColorScales.forEach(scale => {
    const baseName = scale.name.split('-')[0]; // Get color name without the -500
    
    scale.hexValues.forEach((hex, index) => {
      const steps = getStepsForCurrentCount();
      const currentLevel = steps[index];
      
      // Add CSS variable to content
      cssContent += `  --${baseName}-${currentLevel}: ${hex};\n`;
    });
  });
  
  cssContent += '}';
  
  // Update the style element content
  styleElement.textContent = cssContent;
}

// Curve drawing functions removed - no longer needed

// Regenerate all color scales
function regenerateScales() {
  // Clear existing scales
  const scalesContainer = document.querySelector('.scales-container');
  scalesContainer.innerHTML = "";
  window.allColorScales = [];
  
  // Regenerate all color rows
  colorConfigs.forEach((cfg, index) => {
    const row = createScaleRow(cfg, index);
    scalesContainer.appendChild(row);
  });

  // Generate the global-colors.css file
  generateGlobalColorsCss();
}

// Steps count is fixed at 13 - no updating needed

// Initialize everything
const scalesContainer = document.querySelector('.scales-container');

// Initialize with default configs
colorConfigs.forEach((cfg, index) => {
  const row = createScaleRow(cfg, index);
  scalesContainer.appendChild(row);
});

// Generate initial color scales
regenerateScales();

// Always use 13 steps - no tab switching needed

// Format the entire scale data for copying
function formatScaleData() {
  const scaleData = {};
  window.allColorScales.forEach(scale => {
    const colorName = scale.name.split('-')[0];
    scaleData[colorName] = {};
    
    // Get all step numbers from the scale labels
    const steps = getStepsForCurrentCount();
    
    // Map hex values to their steps
    scale.hexValues.forEach((hex, index) => {
      scaleData[colorName][steps[index]] = hex;
    });
  });
  
  return JSON.stringify(scaleData);
}

// Initialize copy scale button
document.getElementById('copy-scale-button').addEventListener('click', async () => {
  const scaleData = formatScaleData();
  await navigator.clipboard.writeText(scaleData);
  
  // Show feedback
  const button = document.getElementById('copy-scale-button');
  const originalText = button.textContent;
  button.textContent = 'Copied!';
  setTimeout(() => {
    button.textContent = originalText;
  }, 1000);
});

// Touch color pill functionality
let touchPillTimeout;

function showTouchColorPill(hexColor) {
  const pill = document.getElementById('touch-color-pill');
  if (!pill) return;
  
  // Update pill content
  pill.textContent = hexColor;
  
  // Show pill
  pill.classList.add('visible');
  
  // Clear existing timeout
  if (touchPillTimeout) {
    clearTimeout(touchPillTimeout);
  }
  
  // Set new timeout to hide after 1.5 seconds
  touchPillTimeout = setTimeout(() => {
    pill.classList.remove('visible');
  }, 1500);
}