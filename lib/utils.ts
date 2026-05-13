export function formatCurrency(amount: unknown, currency: unknown = "MNT") {
  const parsedAmount = Number(amount);
  const safeAmount = Number.isFinite(parsedAmount) ? parsedAmount : 0;
  const normalizedCurrency = typeof currency === "string" ? currency.trim().toUpperCase() : "MNT";
  const safeCurrency = /^[A-Z]{3}$/.test(normalizedCurrency) ? normalizedCurrency : "MNT";

  if (safeCurrency === "MNT") {
    const formattedAmount = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0
    }).format(safeAmount);

    return `₮ ${formattedAmount}`;
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: safeCurrency,
      maximumFractionDigits: 2
    }).format(safeAmount);
  } catch {
    return new Intl.NumberFormat("mn-MN", {
      style: "currency",
      currency: "MNT",
      maximumFractionDigits: 0
    }).format(safeAmount);
  }
}

export function formatDateTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function toNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return 0;
}

export function generateCode(prefix: string) {
  const segment = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${segment}`;
}
