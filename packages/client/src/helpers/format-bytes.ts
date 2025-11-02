/**
 * Convert bytes to a human-readable format.
 *
 * @example
 * ```ts
 * formatBytes(1000) // "1 kB"
 * formatBytes(1000, { decimalPlaces: 2 }) // "1.00 kB"
 * formatBytes(1024, { si: false }) // "1 KiB"
 * ```
 */
export function formatBytes(
  bytes: number,
  options?: {
    /**
     * Use metric units, aka powers of 1000.
     *
     * @default true
     */
    si?: boolean;

    /**
     * Number of decimal places to show.
     *
     * @default 0
     */
    decimalPlaces?: number;
  }
) {
  const { si = true, decimalPlaces = 0 } = options || {};

  const threshold = si ? 1000 : 1024;
  const units = si
    ? ['B', 'kB', 'MB', 'GB', 'TB', 'PB']
    : ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];

  if (bytes < threshold) {
    return `${bytes} ${units[0]}`;
  }

  const exponent = Math.floor(Math.log(bytes) / Math.log(threshold));
  const unit = units[exponent];
  const value = (bytes / Math.pow(threshold, exponent)).toFixed(decimalPlaces);

  return `${value} ${unit}`;
}
