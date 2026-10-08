/**
 * CSV utilities — escaping, BOM (Excel), download.
 */

export type CsvValue = string | number | boolean | null | undefined;

/**
 * Escape a CSV value.
 * - Wraps in quotes if contains comma, quote, newline
 * - Doubles internal quotes
 */
export function escapeCsv(value: CsvValue): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export interface CsvColumn<T> {
  header: string;
  key: string;
  value: (row: T) => CsvValue;
}

/**
 * Convert array of objects to CSV string.
 */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map(c => escapeCsv(c.header)).join(',');
  const body = rows
    .map(row => columns.map(c => escapeCsv(c.value(row))).join(','))
    .join('\n');
  return header + '\n' + body;
}

/**
 * Download a string as a CSV file.
 * Prefixes BOM so Excel detects UTF-8 (important for Cyrillic/Uzbek chars).
 */
export function downloadCsv(filename: string, csvContent: string): void {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : filename + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Build a filename like "leaderboard-ranger-scrims-2026-10-08.csv"
 */
export function buildFilename(prefix: string, ...parts: (string | undefined | null)[]): string {
  const date = new Date().toISOString().slice(0, 10);
  const safeParts = parts
    .filter((p): p is string => Boolean(p))
    .map(p => p.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  return [prefix, ...safeParts, date].join('-') + '.csv';
}