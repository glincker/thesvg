/**
 * Minimal 2D affine matrix math for applying SVG `transform` attributes
 * (translate, scale, rotate, matrix, skewX, skewY) to flattened points.
 */

export type Mat = [number, number, number, number, number, number]; // a b c d e f

export const IDENTITY: Mat = [1, 0, 0, 1, 0, 0];

export function multiplyMat(m1: Mat, m2: Mat): Mat {
  const [a1, b1, c1, d1, e1, f1] = m1;
  const [a2, b2, c2, d2, e2, f2] = m2;
  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1,
  ];
}

export function applyMat(m: Mat, x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

export function parseTransform(str: string | undefined): Mat {
  if (!str) return IDENTITY;
  let result = IDENTITY;
  const re = /(\w+)\s*\(([^)]*)\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(str))) {
    const fn = match[1];
    const args = match[2]
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    let m: Mat = IDENTITY;
    switch (fn) {
      case "translate":
        m = [1, 0, 0, 1, args[0] || 0, args[1] || 0];
        break;
      case "scale": {
        const sx = args[0] ?? 1;
        const sy = args.length > 1 ? args[1] : sx;
        m = [sx, 0, 0, sy, 0, 0];
        break;
      }
      case "rotate": {
        const deg = args[0] || 0;
        const rad = (deg * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        if (args.length >= 3) {
          const cx = args[1];
          const cy = args[2];
          const t1: Mat = [1, 0, 0, 1, cx, cy];
          const r: Mat = [cos, sin, -sin, cos, 0, 0];
          const t2: Mat = [1, 0, 0, 1, -cx, -cy];
          m = multiplyMat(multiplyMat(t1, r), t2);
        } else {
          m = [cos, sin, -sin, cos, 0, 0];
        }
        break;
      }
      case "matrix":
        if (args.length >= 6) {
          m = [args[0], args[1], args[2], args[3], args[4], args[5]];
        }
        break;
      case "skewX": {
        const t = Math.tan((args[0] * Math.PI) / 180);
        m = [1, 0, t, 1, 0, 0];
        break;
      }
      case "skewY": {
        const t = Math.tan((args[0] * Math.PI) / 180);
        m = [1, t, 0, 1, 0, 0];
        break;
      }
      default:
        break;
    }
    result = multiplyMat(result, m);
  }
  return result;
}
