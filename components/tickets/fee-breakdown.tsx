import { formatCurrency } from "@/lib/utils";

type Props = {
  subtotal: number;
  platformFee: number;
  serviceFee: number;
  total: number;
  currency?: string;
};

export function FeeBreakdown({
  subtotal,
  platformFee,
  serviceFee,
  total,
  currency = "USD"
}: Props) {
  return (
    <div className="rounded-[2rem] border border-black/10 bg-white p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/45">
        Transparent fee breakdown
      </p>
      <div className="mt-4 space-y-3 text-sm text-black/70">
        <div className="flex justify-between">
          <span>Face value</span>
          <span>{formatCurrency(subtotal, currency)}</span>
        </div>
        <div className="flex justify-between">
          <span>Platform fee</span>
          <span>{formatCurrency(platformFee, currency)}</span>
        </div>
        <div className="flex justify-between">
          <span>Service fee</span>
          <span>{formatCurrency(serviceFee, currency)}</span>
        </div>
        <div className="flex justify-between border-t border-black/10 pt-3 font-semibold text-ink">
          <span>Total</span>
          <span>{formatCurrency(total, currency)}</span>
        </div>
      </div>
    </div>
  );
}
