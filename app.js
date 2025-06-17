// app.js
import Color from "https://colorjs.io/dist/color.js";
import { generatePerceptuallyUniformScale, ease, curveSettings } from "./scale.js";
import { defaults, colorConfigs, stepsCount } from "./colors.js";
import { computeContrastDotColor, rgbToOklab, oklchToHex } from "./colors-utilities.js";

/* 1) Put stepsCount into CSS var (if you need clamp() later) */
document.documentElement.style.setProperty("--swatch-count", stepsCount);

// Global storage for all generated color scales
window.allColorScales = [];

// Theme and step count management - declare early
let currentStepsCount = 13;
let currentTheme = 'slate';

window.useOklab = false;
window.addEventListener("keydown", (e) => {
  if (e.key === "Shift" && !e.repeat) {
    window.useOklab = !window.useOklab;
  }
});

// Get steps for current count
function getStepsForCurrentCount() {
  const count = currentStepsCount;
  const baseLeft  = [50, 100, 200, 300, 400];
  const baseRight = [600, 700, 800, 900, 950];
  const midLeft   = [150, 250, 350, 450];
  const midRight  = [550, 650, 750, 850];
  const extraTotal   = count - 11;
  const extrasPerSide = extraTotal / 2;

  // Build left (tints)
  const leftStops = baseLeft.slice();
  for (let i = 0; i < extrasPerSide; i++) {
    leftStops.push(midLeft[i]);
  }
  leftStops.sort((a,b)=>a-b);

  // Build right (shades)
  const rightStops = baseRight.slice();
  for (let i = 0; i < extrasPerSide; i++) {
    rightStops.push(midRight[midRight.length - 1 - i]);
  }
  rightStops.sort((a,b)=>a-b);

  return [...leftStops, 500, ...rightStops];
}

function getStepNameForIndex(colorName, stepIndex) {
  const steps = getStepsForCurrentCount();
  return `${colorName}-${steps[stepIndex]}`;
}

// Update swatch count CSS variable whenever it changes
function updateSwatchCount(count) {
  document.documentElement.style.setProperty("--swatch-count", count);
}

function createScaleRow({
  name,
  baseHex,
  startHueShift,
  endHueShift,
  startL: cfgStartL,
  endL:   cfgEndL,
  stepsCount: configStepsCount,
  ...overrides
}, rowIndex) {
  // Use provided stepsCount or fall back to current global value
  const actualStepsCount = configStepsCount || currentStepsCount || stepsCount;
  // Convert baseHex → OKLCH coords:
  const [L01, C04, Hdeg] = new Color(baseHex).to("oklch").coords;
  const baseL = L01 * 100;   // Convert from 0-1 to 0-100 range
  const baseC = C04;         // Keep in 0-0.4 range
  const baseH = Hdeg;

  // Build the "options" object:
  const options = {
    baseL,
    baseC,
    baseH,
    startL:      cfgStartL  ?? defaults.startL,
    startHueShift,
    endL:        cfgEndL    ?? defaults.endL,
    endHueShift,
    stepsCount: actualStepsCount,
    // OKhsl saturation parameters from defaults and overrides
    tintStartS:  overrides.tintStartS  ?? defaults.tintStartS,
    tintEndS:    overrides.tintEndS    ?? defaults.tintEndS,
    shadeStartS: overrides.shadeStartS ?? defaults.shadeStartS,
    shadeEndS:   overrides.shadeEndS   ?? defaults.shadeEndS,
    // Rate parameters from defaults and overrides
    tintLRate:   overrides.tintLRate   ?? defaults.tintLRate,
    shadeLRate:  overrides.shadeLRate  ?? defaults.shadeLRate,
  };

  const fullScaleLCH = generatePerceptuallyUniformScale(options);
  const fullScaleHex = fullScaleLCH.map(oklchToHex);
  
  // Store this scale's data globally
  window.allColorScales.push({
    name: name,
    hexValues: fullScaleHex,
    lchValues: fullScaleLCH,
    config: { name, baseHex, startHueShift, endHueShift, startL: cfgStartL, endL: cfgEndL, ...overrides }
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

// Handle tab switching
function initTabSwitcher() {
  const tabButtons = document.querySelectorAll('.tab-button');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const newStepsCount = parseInt(button.dataset.steps);
      if (newStepsCount === currentStepsCount) return;
      
      // Update active state
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Update steps count
      currentStepsCount = newStepsCount;
      
      // Regenerate everything
      regenerateScales();
      drawEasingCurves();
    });
  });
}

// Function to generate CSS content for all color scales
function generateGlobalColorsCss() {
  
  // Update CSS variables directly in :root
  window.allColorScales.forEach(scale => {
    const baseName = scale.name.split('-')[0]; // Get color name without the -500
    
    scale.hexValues.forEach((hex, index) => {
      // Get the level number for this index using the same logic as createScaleLabels
      const count = currentStepsCount;
      const baseLeft  = [50, 100, 200, 300, 400];
      const baseRight = [600, 700, 800, 900, 950];
      const midLeft   = [150, 250, 350, 450];
      const midRight  = [550, 650, 750, 850];
      const extraTotal   = count - 11;
      const extrasPerSide = extraTotal / 2;

      // Build left (tints)
      const leftStops = baseLeft.slice();
      for (let i = 0; i < extrasPerSide; i++) {
        leftStops.push(midLeft[i]);
      }
      leftStops.sort((a,b)=>a-b);

      // Build right (shades)
      const rightStops = baseRight.slice();
      for (let i = 0; i < extrasPerSide; i++) {
        rightStops.push(midRight[midRight.length - 1 - i]);
      }
      rightStops.sort((a,b)=>a-b);

      const steps = [...leftStops, 500, ...rightStops];
      const currentLevel = steps[index];
      
      // Update CSS variable directly
      document.documentElement.style.setProperty(
        `--${baseName}-${currentLevel}`,
        hex
      );
    });
  });
  
  
}

function drawCurve(svgId, curves) {
  const svg = document.getElementById(svgId);
  if (!svg) {
    console.error(`SVG element with id ${svgId} not found`);
    return;
  }

  // Clear existing content
  svg.innerHTML = '';

  // Add grid lines
  for (let i = 0; i <= 4; i++) {
    const x = Math.round((i / 4) * 280 + 10);
    const y = Math.round((i / 4) * 180 + 10);

    // Vertical grid lines
    const vLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    vLine.setAttribute("x1", x);
    vLine.setAttribute("y1", 10);
    vLine.setAttribute("x2", x);
    vLine.setAttribute("y2", 190);
    vLine.setAttribute("stroke", "var(--border-norm)");
    vLine.setAttribute("stroke-width", "1");
    vLine.setAttribute("shape-rendering", "crispEdges");
    svg.appendChild(vLine);

    // Horizontal grid lines
    const hLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    hLine.setAttribute("x1", 10);
    hLine.setAttribute("y1", y);
    hLine.setAttribute("x2", 290);
    hLine.setAttribute("y2", y);
    hLine.setAttribute("stroke", "var(--border-norm)");
    hLine.setAttribute("stroke-width", "1");
    hLine.setAttribute("shape-rendering", "crispEdges");
    svg.appendChild(hLine);
  }
  
  // Draw each curve
  curves.forEach(curve => {
    const points = [];
    const steps = 100;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Use the imported ease function to match the actual implementation
      let easedValue = ease(t, curve.easing);
      
      const x = 10 + t * 280;
      const y = 190 - easedValue * 180; // Flip Y axis
      points.push(`${x},${y}`);
    }
    
    const pathData = `M${points.join(' L')}`;
    
    // Create path element
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", curve.color);
    path.setAttribute("stroke-width", "2");
    path.setAttribute("opacity", "0.9");
    path.setAttribute("shape-rendering", "geometricPrecision");
    
    // Append path to SVG
    svg.appendChild(path);
  });
}

// Draw separate curves for tints and shades sections
function drawEasingCurves() {
  // Curves for the tint section (50 → 500)
  const tintCurves = [
    { name: 'Tint L', easing: curveSettings.tintLightness, color: '#EE3A59' },  // Tint Lightness - red
    { name: 'Tint S', easing: curveSettings.tintSaturation, color: '#3d88fd' },  // Tint Saturation - blue
    { name: 'H', easing: curveSettings.hue, color: '#14b8a6' }  // Hue - teal
  ];
  
  // Curves for the shade section (500 → 950)
  const shadeCurves = [
    { name: 'Shade L', easing: curveSettings.shadeLightness, color: '#FF6B8A' },  // Shade Lightness - light red
    { name: 'Shade S', easing: curveSettings.shadeSaturation, color: '#87CEEB' },  // Shade Saturation - light blue
    { name: 'H', easing: curveSettings.hue, color: '#14b8a6' }  // Hue - teal
  ];
  
  drawCurve('tint-curve', tintCurves);
  drawCurve('shade-curve', shadeCurves);
}

// Update regenerateScales to include curve drawing
function regenerateScales() {
  // Clear existing scales
  const scalesContainer = document.querySelector('.scales-container');
  scalesContainer.innerHTML = "";
  window.allColorScales = [];
  
  // Regenerate all color rows
  colorConfigs.forEach((cfg, index) => {
    const row = createScaleRow({...cfg, stepsCount: currentStepsCount}, index);
    scalesContainer.appendChild(row);
  });

  // Generate the global-colors.css file
  generateGlobalColorsCss();

  // Redraw the curves to reflect any changes in curve settings
  drawEasingCurves();
}

// Update the steps count and regenerate
function updateStepsCount(newCount) {
  currentStepsCount = newCount;
  regenerateScales();
}

// Initialize everything
const scalesContainer = document.querySelector('.scales-container');

// Initialize with default configs
colorConfigs.forEach((cfg, index) => {
  const row = createScaleRow(cfg, index);
  scalesContainer.appendChild(row);
});

// Generate initial color scales and draw curves
regenerateScales();

// Initialize tab switcher
initTabSwitcher();

// Set initial tab state based on current stepsCount
document.querySelectorAll('.tab-button').forEach(btn => {
  if (parseInt(btn.dataset.steps) === currentStepsCount) {
    btn.classList.add('active');
  } else {
    btn.classList.remove('active');
  }
});

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