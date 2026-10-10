const LOCALE = "nb-NO";

const ratingFormat = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactFormat = new Intl.NumberFormat(LOCALE, {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatRating(rating: number): string {
  return ratingFormat.format(rating);
}

export function formatCompact(value: number): string {
  return compactFormat.format(value);
}

export function formatNumber(value: number, digits = 0): string {
  return value.toLocaleString(LOCALE, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
