export function formatNumber(n: number): string {
  return new Intl.NumberFormat('th-TH').format(n);
}

export function formatSigned(n: number): string {
  if (n > 0) return `+${new Intl.NumberFormat('th-TH').format(n)}`;
  if (n < 0) return new Intl.NumberFormat('th-TH').format(n);
  return '0';
}

export function formatPercent(n: number): string {
  const fixed = n.toFixed(2);
  if (n > 0) return `+${fixed}%`;
  return `${fixed}%`;
}

export function getDiffToneClass(n: number): string {
  if (n < 0) return 'text-[#B91C1C]';
  if (n > 0) return 'text-[#0F766E]';
  return 'text-[#6B7280]';
}

export function getDiffLabel(n: number): string {
  if (n < 0) return 'ขาดเกณฑ์';
  if (n > 0) return 'เกินเกณฑ์';
  return 'พอดีเกณฑ์';
}
