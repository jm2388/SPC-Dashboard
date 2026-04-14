/**
 * Generate histogram bins from raw data array.
 * @param {number[]} data - array of numeric measurements
 * @param {number} binCount - number of bins (default: 20)
 * @returns {{ variable: number, count: number }[]}
 */
export function buildHistogram(data, binCount = 20) {
  if (!data.length) {
    return [];
  }

  const min = Math.min(...data);
  const max = Math.max(...data);

  if (min === max) {
    return [
      {
        variable: min,
        count: data.length,
      },
    ];
  }

  const binWidth = (max - min) / binCount;

  const bins = Array.from({ length: binCount }, (_, i) => ({
    variable: parseFloat((min + i * binWidth + binWidth / 2).toFixed(2)),
    count: 0,
  }));

  data.forEach((val) => {
    const index = Math.min(Math.floor((val - min) / binWidth), binCount - 1);
    bins[index].count++;
  });

  return bins;
}
