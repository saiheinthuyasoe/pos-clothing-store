// Color utilities: convert hex -> Lab and find nearest CSS named color using ΔE

type RGB = { r: number; g: number; b: number };
import colorNames from "./color-names.json";

const cssNamedColors: { name: string; hex: string }[] = Object.entries(
  colorNames as Record<string, string>,
).map(([hex, name]) => ({ name, hex: hex.toUpperCase() }));

function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function rgbToXyz({ r, g, b }: RGB) {
  // sRGB (0..255) -> linear RGB (0..1)
  const srgb = [r / 255, g / 255, b / 255].map((v) => {
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  const [R, G, B] = srgb;
  // Observer = 2°, Illuminant = D65
  const X = R * 0.4124564 + G * 0.3575761 + B * 0.1804375;
  const Y = R * 0.2126729 + G * 0.7151522 + B * 0.072175;
  const Z = R * 0.0193339 + G * 0.119192 + B * 0.9503041;
  return { X: X * 100, Y: Y * 100, Z: Z * 100 };
}

function xyzToLab({ X, Y, Z }: { X: number; Y: number; Z: number }) {
  // Reference white D65
  const refX = 95.047;
  const refY = 100.0;
  const refZ = 108.883;

  let x = X / refX;
  let y = Y / refY;
  let z = Z / refZ;

  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);

  const L = 116 * f(y) - 16;
  const a = 500 * (f(x) - f(y));
  const b = 200 * (f(y) - f(z));
  return { L, a, b };
}

function rgbToLab(rgb: RGB) {
  return xyzToLab(rgbToXyz(rgb));
}

function deltaE(
  lab1: { L: number; a: number; b: number },
  lab2: { L: number; a: number; b: number },
) {
  const dL = lab1.L - lab2.L;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

export function detectColorName(hex: string): string {
  try {
    const target = rgbToLab(hexToRgb(hex));
    let best = { name: "", dist: Number.POSITIVE_INFINITY };
    for (const c of cssNamedColors) {
      const lab = rgbToLab(hexToRgb(c.hex));
      const d = deltaE(target, lab);
      if (d < best.dist) {
        best = { name: c.name, dist: d };
      }
    }
    return best.name;
  } catch (e) {
    return "";
  }
}
