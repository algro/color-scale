// app.js
import Color from "https://colorjs.io/dist/color.js";
import { generateTintShadeScale, ease } from "./scale.js";
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
}) {
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
  };

  // Debug: Log the defaults and final options
  console.log('defaults object:', defaults);
  console.log('overrides object:', overrides);
  console.log('final options:', options);

  const fullScaleLCH = generateTintShadeScale(options);
  const fullScaleHex = fullScaleLCH.map(oklchToHex);
  
  // Store this scale's data globally for vertical copying
  window.allColorScales.push({
    name: name,
    hexValues: fullScaleHex,
    lchValues: fullScaleLCH
  });

  const row = document.createElement("div");
  row.className = "row scale-row";

  const colorLabel = document.createElement("div");
  colorLabel.className = "color-label";
  colorLabel.textContent = name.split("-")[0];

  // Add tooltip for color label
  const labelTooltip = document.createElement("div");
  labelTooltip.className = "tooltip";
  colorLabel.appendChild(labelTooltip);

  // Add event listeners for color label
  colorLabel.addEventListener("mouseenter", () => {
    labelTooltip.textContent = "Copy hex values";
  });
  
  colorLabel.addEventListener("mouseleave", () => {
    labelTooltip.textContent = "";
  });

  colorLabel.addEventListener("click", async () => {
    // Collect all hex values from this row
    const hexValues = fullScaleHex.join(", ");
    await navigator.clipboard.writeText(hexValues);
    
    // Show confirmation
    labelTooltip.textContent = "Copied to clipboard!";
    setTimeout(() => {
      labelTooltip.textContent = "Copy hex values";
    }, 1000);
  });

  const swatchContainer = document.createElement("div");
  swatchContainer.className = "swatch-container";

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
      if (window.useOklab) {
        const { L, C, H } = sw.__oklchCoords;
        const Lpct = L.toFixed(1) + '%';
        tooltip.textContent = `oklch(${Lpct} ${C.toFixed(3)} ${H.toFixed(1)})`;
      } else {
        tooltip.textContent = hex;
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
        // Restore original color value
        tooltip.textContent = window.useOklab
          ? (()=>{
              const { L, C, H } = sw.__oklchCoords;
              const Lpct = L.toFixed(1) + '%';
              return `oklch(${Lpct} ${C.toFixed(3)} ${H.toFixed(1)})`;
            })()
          : hex;
      }, 1000);
    });

    swatchContainer.appendChild(sw);
  });

  row.appendChild(colorLabel);
  row.appendChild(swatchContainer);
  return row;
}


/* Finally, hook everything up: */
// Clear global storage and generate all scales first
window.allColorScales = [];

const scalesContainer = document.getElementById("scales");
colorConfigs.forEach(cfg => {
  const row = createScaleRow(cfg);
  scalesContainer.appendChild(row);
});

// Create scale labels after all data is generated
createScaleLabels();

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
  
  // Update theme colors for new dark/light mode using current color theme
  updateThemeColors(currentTheme);
}

// Initialize dark mode
initDarkMode();

// Add event listener to toggle button
document.getElementById('dark-mode-toggle').addEventListener('click', toggleDarkMode);

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
  console.log('Starting CSS generation...');
  
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
  
  console.log('CSS variables updated in memory');
}

function drawCurve(svgId, curves) {
  const svg = document.getElementById(svgId);
  if (!svg) return; // Guard against missing elements

  svg.innerHTML = '';

  // Add grid lines
  for (let i = 0; i <= 4; i++) {
    const x = Math.round((i / 4) * 280 + 10);
    const y = Math.round((i / 4) * 180 + 10);

    // Vertical grid lines
    svg.innerHTML += `<line x1="${x}" y1="10" x2="${x}" y2="190" stroke="var(--border-norm)" stroke-width="1" shape-rendering="crispEdges"/>`;
    // Horizontal grid lines
    svg.innerHTML += `<line x1="10" y1="${y}" x2="290" y2="${y}" stroke="var(--border-norm)" stroke-width="1" shape-rendering="crispEdges"/>`;
  }
  
  // Draw each curve
  curves.forEach(curve => {
    const points = [];
    const steps = 100;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const easedValue = ease(t, curve.easing);
      const x = 10 + t * 280;
      const y = 190 - easedValue * 180; // Flip Y axis
      points.push(`${x},${y}`);
    }
    
    const pathData = `M${points.join(' L')}`;
    svg.innerHTML += `<path d="${pathData}" fill="none" stroke="${curve.color}" stroke-width="1" opacity="0.8" shape-rendering="geometricPrecision"/>`;
  });
}

// Draw easing curves using simplified curve names
function drawEasingCurves() {
  // Use consistent curves regardless of step count
  const tintCurve = "bezierTint";
  const shadeCurve = "bezierShade";
  const tintHueCurve = "bezierTintHue";
  const shadeHueCurve = "bezierShadeHue";
  
  // Draw tint curves
  drawCurve('tint-curve', [
    { name: 'L', easing: tintCurve, color: '#EE3A59' },  // rose-500
    { name: 'S', easing: 'bezierTintSaturation', color: '#3d88fd' },  // blue-500
    { name: 'H', easing: tintHueCurve, color: '#14b8a6' }  // teal-500
  ]);
  
  // Draw shade curves
  drawCurve('shade-curve', [
    { name: 'L', easing: shadeCurve, color: '#EE3A59' },  // rose-500
    { name: 'S', easing: 'bezierShadeSaturation', color: '#3d88fd' },  // blue-500
    { name: 'H', easing: shadeHueCurve, color: '#14b8a6' }  // teal-500
  ]);
}

// Update regenerateScales to include curve drawing
function regenerateScales() {
  // Clear existing scales
  const scalesContainer = document.getElementById("scales");
  scalesContainer.innerHTML = "";
  window.allColorScales = [];
  
  // Create new scale labels
  createScaleLabels();
  
  // Regenerate all color rows
  colorConfigs.forEach(cfg => {
    const row = createScaleRow({...cfg, stepsCount: currentStepsCount});
    scalesContainer.appendChild(row);
  });

  // Generate the global-colors.css file
  generateGlobalColorsCss();
}

// Update createScaleLabels to use dynamic stepsCount  
function createScaleLabels() {
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
  const labelRow = document.getElementById("scale-labels");
  labelRow.innerHTML = "";
  steps.forEach((num, stepIndex) => {
    const lbl = document.createElement("div");
    lbl.className = "scale-label";
    lbl.textContent = num;
    lbl.style.cursor = "pointer";
    
    // Add tooltip for scale label
    const labelTooltip = document.createElement("div");
    labelTooltip.className = "tooltip";
    lbl.appendChild(labelTooltip);

    // Add hover and click functionality
    lbl.addEventListener("mouseenter", () => {
      labelTooltip.textContent = "Copy hex values";
    });

    lbl.addEventListener("mouseleave", () => {
      labelTooltip.textContent = "";
    });

    lbl.addEventListener("click", async () => {
      // Collect hex values at this step index from all colors
      const hexValues = window.allColorScales.map(scale => scale.hexValues[stepIndex]);
      const hexString = hexValues.join(", ");
      
      await navigator.clipboard.writeText(hexString);
      
      // Show confirmation
      labelTooltip.textContent = "Copied to clipboard!";
      setTimeout(() => {
        labelTooltip.textContent = "Copy hex values";
      }, 1000);
    });
    
    labelRow.appendChild(lbl);
  });
};

// Generate initial color scales and draw curves
regenerateScales();
drawEasingCurves();

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
    const steps = Array.from(document.querySelectorAll('.scale-label'))
      .map(label => label.textContent);
    
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