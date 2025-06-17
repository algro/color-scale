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
let selectedColorIndex = -1; // Track which color is selected for editing

window.useOklab = false;
window.addEventListener("keydown", (e) => {
  if (e.key === "Shift" && !e.repeat) {
    window.useOklab = !window.useOklab;
  }
});

// URL state management - similar to ColorBox.io
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

  // Debug: Log the defaults and final options
  console.log('defaults object:', defaults);
  console.log('overrides object:', overrides);
  console.log('final options:', options);

  const fullScaleLCH = generatePerceptuallyUniformScale(options);
  const fullScaleHex = fullScaleLCH.map(oklchToHex);
  
  // Store this scale's data globally for vertical copying
  window.allColorScales.push({
    name: name,
    hexValues: fullScaleHex,
    lchValues: fullScaleLCH,
    config: { name, baseHex, startHueShift, endHueShift, startL: cfgStartL, endL: cfgEndL, ...overrides }
  });

  const row = document.createElement("div");
  row.className = "column scale-row";
  row.dataset.rowIndex = rowIndex;

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

  // Create hover-activated checkbox
  const checkboxContainer = document.createElement("div");
  checkboxContainer.className = "color-row-checkbox";
  
  const checkbox = document.createElement("input");
  checkbox.type = "radio"; // Use radio button for only one selection
  checkbox.name = "color-selection";
  checkbox.className = "color-checkbox";
  checkbox.value = rowIndex;
  
  checkboxContainer.appendChild(checkbox);
  
  // Handle checkbox selection
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      selectedColorIndex = rowIndex;
      showColorEditor(rowIndex);
    }
  });

  row.appendChild(swatchContainer);
  row.appendChild(checkboxContainer);
  
  // Add hover effects for checkbox visibility
  row.addEventListener("mouseenter", () => {
    checkboxContainer.style.opacity = "1";
  });
  
  row.addEventListener("mouseleave", () => {
    if (!checkbox.checked) {
      checkboxContainer.style.opacity = "0";
    }
  });

  return row;
}

// Show/hide color editor pane
function showColorEditor(colorIndex) {
  let editorPane = document.getElementById("color-editor-pane");
  
  if (!editorPane) {
    // Create the editor pane
    editorPane = document.createElement("div");
    editorPane.id = "color-editor-pane";
    editorPane.className = "color-editor-pane";
    
    const container = document.querySelector(".container");
    container.appendChild(editorPane);
  }
  
  // Show the pane
  editorPane.style.display = "block";
  
  // Populate with current color's settings
  populateColorEditor(colorIndex);
}

function hideColorEditor() {
  const editorPane = document.getElementById("color-editor-pane");
  if (editorPane) {
    editorPane.style.display = "none";
  }
  selectedColorIndex = -1;
  
  // Uncheck all checkboxes
  document.querySelectorAll(".color-checkbox").forEach(cb => {
    cb.checked = false;
    cb.closest(".color-row-checkbox").style.opacity = "0";
  });
}

function populateColorEditor(colorIndex) {
  const editorPane = document.getElementById("color-editor-pane");
  const config = window.allColorScales[colorIndex].config;
  const colorName = config.name.split("-")[0];
  
  editorPane.innerHTML = `
    <div class="editor-header">
      <h3>Color Settings</h3>
      <button class="close-editor" onclick="hideColorEditor()">×</button>
    </div>
    <form class="color-form">
      <div class="form-group">
        <label>Name:</label>
        <input type="text" id="color-name" value="${colorName}" data-property="name">
      </div>
      <div class="form-group">
        <label>Color:</label>
        <input type="color" id="color-base" value="${config.baseHex}" data-property="baseHex">
        <input type="text" id="color-hex" value="${config.baseHex}" data-property="baseHex">
      </div>
      <div class="form-group">
        <label>Start luminance:</label>
        <input type="number" id="start-luminance" value="${config.startL ?? defaults.startL}" min="0" max="100" step="0.1" data-property="startL">
      </div>
      <div class="form-group">
        <label>End luminance:</label>
        <input type="number" id="end-luminance" value="${config.endL ?? defaults.endL}" min="0" max="100" step="0.1" data-property="endL">
      </div>
      <div class="form-group">
        <label>Tint lightness rate:</label>
        <input type="number" id="tint-l-rate" value="${config.tintLRate ?? defaults.tintLRate}" min="1" max="2" step="0.01" data-property="tintLRate">
        <span class="form-hint">Tint target lightness as % of base-500 (1.0 = 100%, 1.1 = 110%). Must be ≥ 1.0</span>
      </div>
      <div class="form-group">
        <label>Shade lightness rate:</label>
        <input type="number" id="shade-l-rate" value="${config.shadeLRate ?? defaults.shadeLRate}" min="0" max="1" step="0.01" data-property="shadeLRate">
        <span class="form-hint">Shade start lightness as % of base-500 (1.0 = 100%, 0.9 = 90%). Must be ≤ 1.0</span>
      </div>
      <div class="form-group">
        <label>Tint start saturation:</label>
        <input type="number" id="tint-start-sat" value="${config.tintStartS ?? defaults.tintStartS}" min="0" max="1" step="0.01" data-property="tintStartS">
      </div>
      <div class="form-group">
        <label>Tint end saturation:</label>
        <input type="number" id="tint-end-sat" value="${config.tintEndS ?? defaults.tintEndS}" min="0" max="1" step="0.01" data-property="tintEndS">
      </div>
      <div class="form-group">
        <label>Shade start saturation:</label>
        <input type="number" id="shade-start-sat" value="${config.shadeStartS ?? defaults.shadeStartS}" min="0" max="1" step="0.01" data-property="shadeStartS">
      </div>
      <div class="form-group">
        <label>Shade end saturation:</label>
        <input type="number" id="shade-end-sat" value="${config.shadeEndS ?? defaults.shadeEndS}" min="0" max="1" step="0.01" data-property="shadeEndS">
      </div>
      <div class="form-group">
        <label>Start hue shift:</label>
        <input type="number" id="start-hue-shift" value="${config.startHueShift}" min="-180" max="180" step="0.1" data-property="startHueShift">
      </div>
      <div class="form-group">
        <label>End hue shift:</label>
        <input type="number" id="end-hue-shift" value="${config.endHueShift}" min="-180" max="180" step="0.1" data-property="endHueShift">
      </div>
    </form>
  `;
  
  // Add event listeners for real-time updates
  const form = editorPane.querySelector(".color-form");
  form.addEventListener("input", (e) => {
    if (e.target.dataset.property) {
      updateColorConfig(colorIndex, e.target.dataset.property, e.target.value);
    }
  });
  
  // Sync color picker and text input
  const colorPicker = editorPane.querySelector("#color-base");
  const colorText = editorPane.querySelector("#color-hex");
  
  colorPicker.addEventListener("input", () => {
    colorText.value = colorPicker.value;
    updateColorConfig(colorIndex, "baseHex", colorPicker.value);
  });
  
  colorText.addEventListener("input", () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(colorText.value)) {
      colorPicker.value = colorText.value;
      updateColorConfig(colorIndex, "baseHex", colorText.value);
    }
  });
}

function updateColorConfig(colorIndex, property, value) {
  // Update the config
  const config = window.allColorScales[colorIndex].config;
  
  if (property === "name") {
    config.name = `${value}-500`;
  } else if (property === "baseHex") {
    config.baseHex = value;
  } else {
    config[property] = parseFloat(value);
  }
  
  // Regenerate just this color row
  regenerateColorRow(colorIndex);
  
  // Update URL state
  updateURLState();
}

function regenerateColorRow(colorIndex) {
  console.log('regenerateColorRow called with colorIndex:', colorIndex);
  console.log('scalesContainer:', scalesContainer);
  console.log('window.allColorScales:', window.allColorScales);
  
  if (!scalesContainer) {
    console.error('scalesContainer is null, trying to find it again');
    const container = document.querySelector('.scales-container');
    if (!container) {
      console.error('Could not find .scales-container element');
      return;
    }
    // Update the global reference
    window.scalesContainer = container;
  }
  
  const config = window.allColorScales[colorIndex].config;
  console.log('config:', config);
  
  const containerToUse = scalesContainer || window.scalesContainer;
  const oldRow = containerToUse.children[colorIndex];
  console.log('oldRow:', oldRow);
  
  // Generate new row
  const newRow = createScaleRow(config, colorIndex);
  
  // Replace old row
  containerToUse.replaceChild(newRow, oldRow);
  
  // Update global scales array
  window.allColorScales[colorIndex] = generateScaleData(config, colorIndex);
  
  // Keep editor open if this color was selected
  if (selectedColorIndex === colorIndex) {
    newRow.querySelector(".color-checkbox").checked = true;
    newRow.querySelector(".color-row-checkbox").style.opacity = "1";
  }
}

function generateScaleData(config, colorIndex) {
  const actualStepsCount = config.stepsCount || currentStepsCount || stepsCount;
  const [L01, C04, Hdeg] = new Color(config.baseHex).to("oklch").coords;
  const baseL = L01 * 100;
  const baseC = C04;
  const baseH = Hdeg;

  const options = {
    baseL,
    baseC,
    baseH,
    startL: config.startL ?? defaults.startL,
    startHueShift: config.startHueShift,
    endL: config.endL ?? defaults.endL,
    endHueShift: config.endHueShift,
    stepsCount: actualStepsCount,
    tintStartS: config.tintStartS ?? defaults.tintStartS,
    tintEndS: config.tintEndS ?? defaults.tintEndS,
    shadeStartS: config.shadeStartS ?? defaults.shadeStartS,
    shadeEndS: config.shadeEndS ?? defaults.shadeEndS,
    tintLRate: config.tintLRate ?? defaults.tintLRate,
    shadeLRate: config.shadeLRate ?? defaults.shadeLRate,
  };

  const fullScaleLCH = generatePerceptuallyUniformScale(options);
  const fullScaleHex = fullScaleLCH.map(oklchToHex);
  
  return {
    name: config.name,
    hexValues: fullScaleHex,
    lchValues: fullScaleLCH,
    config: config
  };
}

// URL state management functions
function updateURLState() {
  const params = new URLSearchParams();
  
  window.allColorScales.forEach((scale, index) => {
    const config = scale.config;
    const colorData = {
      name: config.name,
      baseHex: config.baseHex,
      startL: config.startL,
      endL: config.endL,
      startHueShift: config.startHueShift,
      endHueShift: config.endHueShift,
      tintStartS: config.tintStartS,
      tintEndS: config.tintEndS,
      shadeStartS: config.shadeStartS,
      shadeEndS: config.shadeEndS,
      tintLRate: config.tintLRate,
      shadeLRate: config.shadeLRate
    };
    
    params.set(`c${index}`, JSON.stringify(colorData));
  });
  
  params.set('steps', currentStepsCount.toString());
  
  const newURL = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, '', newURL);
}

function loadURLState() {
  const params = new URLSearchParams(window.location.search);
  
  // Load step count
  if (params.has('steps')) {
    currentStepsCount = parseInt(params.get('steps'));
  }
  
  // Load color configurations
  const urlConfigs = [];
  let index = 0;
  while (params.has(`c${index}`)) {
    try {
      const colorData = JSON.parse(params.get(`c${index}`));
      urlConfigs.push(colorData);
    } catch (e) {
      console.warn(`Failed to parse color config ${index}:`, e);
    }
    index++;
  }
  
  // If we have URL configs, use them instead of defaults
  if (urlConfigs.length > 0) {
    return urlConfigs;
  }
  
  return null;
}

/* Finally, hook everything up: */
// Load URL state first
const urlConfigs = loadURLState();

// Clear global storage and generate all scales first
window.allColorScales = [];

// Get the container element and make it globally accessible
const scalesContainer = document.querySelector('.scales-container');
window.scalesContainer = scalesContainer;

console.log('Initial scalesContainer setup:', scalesContainer);

// Initialize with default configs
const configsToUse = urlConfigs || colorConfigs;
configsToUse.forEach((cfg, index) => {
  const row = createScaleRow(cfg, index);
  scalesContainer.appendChild(row);
});

// Make hideColorEditor globally available
window.hideColorEditor = hideColorEditor;

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
    console.log(`Drawing curve ${curve.name} with easing ${curve.easing}`);
    const points = [];
    const steps = 100;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Use standard easing functions directly for visualization
      let easedValue;
      switch (curve.easing) {
        case 'linear':
          easedValue = t;
          break;
        case 'easeInOutSine':
          easedValue = -(Math.cos(Math.PI * t) - 1) / 2;
          break;
        case 'easeInOutQuad':
          easedValue = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          break;
        case 'easeInOutCubic':
          easedValue = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          break;
        case 'easeInOutQuart':
          easedValue = t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
          break;
        case 'easeInOutQuint':
          easedValue = t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
          break;
        default:
          console.warn(`Unknown easing type: ${curve.easing}, falling back to linear`);
          easedValue = t; // fallback to linear
      }
      const x = 10 + t * 280;
      const y = 190 - easedValue * 180; // Flip Y axis
      points.push(`${x},${y}`);
    }
    
    const pathData = `M${points.join(' L')}`;
    console.log(`Generated path data for ${curve.name}:`, pathData);
    
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

// Update the curve colors to use fixed hex values matching the legend
function drawEasingCurves() {
  const curves = [
    { name: 'L', easing: curveSettings.lightness, color: '#EE3A59' },  // Lightness - red
    { name: 'S', easing: curveSettings.saturation, color: '#3d88fd' },  // Saturation - blue
    { name: 'H', easing: curveSettings.hue, color: '#14b8a6' }  // Hue - teal
  ];
  
  drawCurve('tint-curve', curves);
  drawCurve('shade-curve', curves);
}

// Update regenerateScales to include curve drawing
function regenerateScales() {
  // Clear existing scales
  scalesContainer.innerHTML = "";
  window.allColorScales = [];
  
  // Hide color editor if open
  hideColorEditor();
  
  // Use current configurations (might be from URL)
  const currentConfigs = window.allColorScales.length > 0 
    ? window.allColorScales.map(s => s.config)
    : colorConfigs;
  
  // Regenerate all color rows
  currentConfigs.forEach((cfg, index) => {
    const row = createScaleRow({...cfg, stepsCount: currentStepsCount}, index);
    scalesContainer.appendChild(row);
  });

  // Generate the global-colors.css file
  generateGlobalColorsCss();
  
  // Update URL state
  updateURLState();

  // Redraw the curves to reflect any changes in curve settings
  drawEasingCurves();
}

// Update the steps count and regenerate
function updateStepsCount(newCount) {
  currentStepsCount = newCount;
  regenerateScales();
}

// Force redraw of curves
function redrawCurves() {
  console.log('Redrawing curves with settings:', curveSettings);
  drawEasingCurves();
}

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