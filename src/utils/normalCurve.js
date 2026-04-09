/**
 * Returns normal PDF value at x given mean and std.
 */
function normalPDF(x, mean, std) {
  return (
    (1 / (std * Math.sqrt(2 * Math.PI))) *
    Math.exp(-0.5 * Math.pow((x - mean) / std, 2))
  );
}

/**
 * Build curve points scaled to histogram observation counts.
 * @param {number} mean
 * @param {number} std
 * @param {number} totalCount
 * @param {number} binWidth
 * @param {number} xMin
 * @param {number} xMax
 * @param {number} resolution
 * @returns {{ variable: number, curve: number }[]}
 */
export function buildNormalCurve(
  mean,
  std,
  totalCount,
  binWidth,
  xMin,
  xMax,
  resolution = 100
) {
  const step = (xMax - xMin) / resolution;
  return Array.from({ length: resolution + 1 }, (_, i) => {
    const x = xMin + i * step;
    const y = normalPDF(x, mean, std) * totalCount * binWidth;
    return {
      variable: parseFloat(x.toFixed(3)),
      curve: parseFloat(y.toFixed(2)),
    };
  });
}

/**
 * Merge curve values onto histogram bins by nearest variable match.
 * @param {Array} bins
 * @param {Array} curve
 * @returns {Array}
 */
export function mergeData(bins, curve) {
  return bins.map((bin) => {
    const closest = curve.reduce((a, b) =>
      Math.abs(b.variable - bin.variable) < Math.abs(a.variable - bin.variable)
        ? b
        : a
    );
    return { ...bin, curve: closest.curve };
  });
}
