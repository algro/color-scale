// okhsl.js
// OKhsl implementation based on Björn Ottosson's work
// https://bottosson.github.io/posts/colorpicker/#okhsl

const PI = Math.PI;

// Helper functions for OKhsl
function cbrt(x) {
  return Math.sign(x) * Math.pow(Math.abs(x), 1/3);
}

function srgbTransferFunction(x) {
  return x >= 0.0031308 ? 1.055 * Math.pow(x, 1/2.4) - 0.055 : 12.92 * x;
}

function srgbTransferFunctionInv(x) {
  return x >= 0.04045 ? Math.pow((x + 0.055) / 1.055, 2.4) : x / 12.92;
}

function linearSrgbToOklab(rgb) {
  const l = 0.4122214708 * rgb.r + 0.5363325363 * rgb.g + 0.0514459929 * rgb.b;
  const m = 0.2119034982 * rgb.r + 0.6806995451 * rgb.g + 0.1073969566 * rgb.b;
  const s = 0.0883024619 * rgb.r + 0.2817188376 * rgb.g + 0.6299787005 * rgb.b;

  const l_ = cbrt(l);
  const m_ = cbrt(m);
  const s_ = cbrt(s);

  return {
    L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
  };
}

function oklabToLinearSrgb(lab) {
  const l_ = lab.L + 0.3963377774 * lab.a + 0.2158037573 * lab.b;
  const m_ = lab.L - 0.1055613458 * lab.a - 0.0638541728 * lab.b;
  const s_ = lab.L - 0.0894841775 * lab.a - 1.2914855480 * lab.b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return {
    r: +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  };
}

function findCusp(a, b) {
  // First, find the maximum saturation (saturation S = C/L)
  const S_cusp = computeMaxSaturation(a, b);
  
  // Convert to linear sRGB to find the first point where at least one of r,g or b >= 1:
  const rgb_at_max = oklabToLinearSrgb({ L: 1, a: S_cusp * a, b: S_cusp * b });
  const L_cusp = cbrt(1 / Math.max(Math.max(rgb_at_max.r, rgb_at_max.g), Math.max(rgb_at_max.b, 0)));
  const C_cusp = L_cusp * S_cusp;

  return { L: L_cusp, C: C_cusp };
}

function computeMaxSaturation(a, b) {
  // Max saturation will be when one of r, g or b goes below zero.
  
  let k0, k1, k2, k3, k4, wl, wm, ws;

  // Red component
  if (-1.88170328 * a - 0.80936493 * b > 1) {
    k0 = +1.19086277; k1 = +1.76576728; k2 = +0.59662641; k3 = +0.75515197; k4 = +0.56771245;
    wl = +4.0767416621; wm = -3.3077115913; ws = +0.2309699292;
  }
  // Green component
  else if (1.81444104 * a - 1.19445276 * b > 1) {
    k0 = +0.73956515; k1 = -0.45954404; k2 = +0.08285427; k3 = +0.12541070; k4 = +0.14503204;
    wl = -1.2684380046; wm = +2.6097574011; ws = -0.3413193965;
  }
  // Blue component
  else {
    k0 = +1.35733652; k1 = -0.00915799; k2 = -1.15130210; k3 = -0.50559606; k4 = +0.00692167;
    wl = -0.0041960863; wm = -0.7034186147; ws = +1.7076147010;
  }

  // Approximate max saturation using a polynomial:
  let S = k0 + k1 * a + k2 * b + k3 * a * a + k4 * a * b;

  // Do one step Halley's method to get closer
  // this gives an error less than 10e6, except for some blue hues where the dS/dh is close to infinite
  // this should be sufficient for most applications, otherwise do two/three steps 

  const k_l = +0.3963377774 * a + 0.2158037573 * b;
  const k_m = -0.1055613458 * a - 0.0638541728 * b;
  const k_s = -0.0894841775 * a - 1.2914855480 * b;

  {
    const l_ = 1 + S * k_l;
    const m_ = 1 + S * k_m;
    const s_ = 1 + S * k_s;

    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;

    const l_dS = 3 * k_l * l_ * l_;
    const m_dS = 3 * k_m * m_ * m_;
    const s_dS = 3 * k_s * s_ * s_;

    const l_d2S = 6 * k_l * k_l * l_;
    const m_d2S = 6 * k_m * k_m * m_;
    const s_d2S = 6 * k_s * k_s * s_;

    const f = wl * l + wm * m + ws * s;
    const f1 = wl * l_dS + wm * m_dS + ws * s_dS;
    const f2 = wl * l_d2S + wm * m_d2S + ws * s_d2S;

    S = S - f * f1 / (f1 * f1 - 0.5 * f * f2);
  }

  return S;
}

function toe(x) {
  const k_1 = 0.206;
  const k_2 = 0.03;
  const k_3 = (1 + k_1) / (1 + k_2);
  return 0.5 * (k_3 * x - k_1 + Math.sqrt((k_3 * x - k_1) * (k_3 * x - k_1) + 4 * k_2 * k_3 * x));
}

function toeInv(x) {
  const k_1 = 0.206;
  const k_2 = 0.03;
  const k_3 = (1 + k_1) / (1 + k_2);
  return (x * x + k_1 * x) / (k_3 * (x + k_2));
}

function getSTMid(a_, b_) {
  const S = 0.11516993 + 1 / (
    7.44778970 + 4.15901240 * b_
    + a_ * (-2.19557347 + 1.75198401 * b_
      + a_ * (-2.13704948 - 10.02301043 * b_
        + a_ * (-4.24894561 + 5.38770819 * b_ + 4.69891013 * a_)))
  );

  const T = 0.11239642 + 1 / (
    1.61320320 - 0.68124379 * b_
    + a_ * (0.40370612 + 0.90148123 * b_
      + a_ * (-0.27087943 + 0.61223990 * b_
        + a_ * (0.00299215 - 0.45399568 * b_ - 0.14661872 * a_)))
  );

  return { S, T };
}

function getCs(L, a_, b_) {
  const cusp = findCusp(a_, b_);
  const C_max = findGamutIntersection(a_, b_, L, 1, L, cusp);
  const ST_max = { S: cusp.C / cusp.L, T: cusp.C / (1 - cusp.L) };
  
  // Scale factor to compensate for the curved part of gamut shape:
  const k = C_max / Math.min(L * ST_max.S, (1 - L) * ST_max.T);

  let C_mid;
  {
    const ST_mid = getSTMid(a_, b_);
    // Use a soft minimum function, instead of a sharp triangle shape to get a smooth value for chroma.
    const C_a = L * ST_mid.S;
    const C_b = (1 - L) * ST_mid.T;
    C_mid = 0.9 * k * Math.sqrt(Math.sqrt(1 / (1 / Math.pow(C_a, 4) + 1 / Math.pow(C_b, 4))));
  }

  let C_0;
  {
    // for C_0, the shape is independent of hue, so ST are constant. Values picked to roughly be the average values of ST.
    const C_a = L * 0.4;
    const C_b = (1 - L) * 0.8;
    // Use a soft minimum function, instead of a sharp triangle shape to get a smooth value for chroma.
    C_0 = Math.sqrt(1 / (1 / (C_a * C_a) + 1 / (C_b * C_b)));
  }

  return { C_0, C_mid, C_max };
}

function findGamutIntersection(a, b, L1, C1, L0, cusp) {
  // Find the intersection for upper part of the gamut, L > L_cusp
  if (((L1 - L0) * cusp.C - (cusp.L - L0) * C1) <= 0) {
    // Lower part
    return cusp.C * L0 / (C1 * cusp.L + cusp.C * (L0 - L1));
  }
  // Upper part
  
  // First intersect with triangle
  return cusp.C * (L0 - 1) / (C1 * (cusp.L - 1) + cusp.C * (L0 - L1));
}

/**
 * Convert OKLCH to OKhsl
 * @param {number} L - Lightness (0-100)
 * @param {number} C - Chroma (0-0.4)
 * @param {number} H - Hue (0-360 degrees)
 * @returns {object} - {h, s, l} where h is 0-1, s is 0-1, l is 0-1
 */
export function oklchToOKhsl(L, C, H) {
  // Convert OKLCH to Oklab
  const h_rad = H * PI / 180;
  const lab = {
    L: L / 100,
    a: C * Math.cos(h_rad),
    b: C * Math.sin(h_rad)
  };

  const C_lab = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  const a_ = lab.a / C_lab;
  const b_ = lab.b / C_lab;

  const L_oklab = lab.L;
  const h = 0.5 + 0.5 * Math.atan2(-lab.b, -lab.a) / PI;

  const cs = getCs(L_oklab, a_, b_);
  const { C_0, C_mid, C_max } = cs;

  // Inverse of the interpolation in okhsl_to_srgb:
  const mid = 0.8;
  const mid_inv = 1.25;

  let s;
  if (C_lab < C_mid) {
    const k_1 = mid * C_0;
    const k_2 = 1 - k_1 / C_mid;
    const t = C_lab / (k_1 + k_2 * C_lab);
    s = t * mid;
  } else {
    const k_0 = C_mid;
    const k_1 = (1 - mid) * C_mid * C_mid * mid_inv * mid_inv / C_0;
    const k_2 = 1 - k_1 / (C_max - C_mid);
    const t = (C_lab - k_0) / (k_1 + k_2 * (C_lab - k_0));
    s = mid + (1 - mid) * t;
  }

  const l = toe(L_oklab);
  return { h, s, l };
}

/**
 * Convert OKhsl to OKLCH
 * @param {number} h - Hue (0-1)
 * @param {number} s - Saturation (0-1)
 * @param {number} l - Lightness (0-1)
 * @returns {object} - {L, C, H} where L is 0-100, C is 0-0.4, H is 0-360 degrees
 */
export function okhslToOKLCH(h, s, l) {
  if (l === 1.0) {
    return { L: 100, C: 0, H: h * 360 };
  } else if (l === 0.0) {
    return { L: 0, C: 0, H: h * 360 };
  }

  const a_ = Math.cos(2 * PI * h);
  const b_ = Math.sin(2 * PI * h);
  const L = toeInv(l);

  const cs = getCs(L, a_, b_);
  const { C_0, C_mid, C_max } = cs;

  // Interpolate the three values for C so that:
  // At s=0: dC/ds = C_0, C=0
  // At s=0.8: C=C_mid
  // At s=1.0: C=C_max

  const mid = 0.8;
  const mid_inv = 1.25;

  let C;
  if (s < mid) {
    const t = mid_inv * s;
    const k_1 = mid * C_0;
    const k_2 = 1 - k_1 / C_mid;
    C = t * k_1 / (1 - k_2 * t);
  } else {
    const t = (s - mid) / (1 - mid);
    const k_0 = C_mid;
    const k_1 = (1 - mid) * C_mid * C_mid * mid_inv * mid_inv / C_0;
    const k_2 = 1 - k_1 / (C_max - C_mid);
    C = k_0 + t * k_1 / (1 - k_2 * t);
  }

  return {
    L: L * 100,
    C: C,
    H: h * 360
  };
} 