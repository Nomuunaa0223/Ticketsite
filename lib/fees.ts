import { toNumber } from "@/lib/utils";

type FeeInput = {
  unitPrice: number;
  quantity?: number;
  platformFeeBps?: number;
  serviceFeeBps?: number;
  sellerFeeBps?: number;
};

export function calculateTransparentFees({
  unitPrice,
  quantity = 1,
  platformFeeBps = 900,
  serviceFeeBps = 350,
  sellerFeeBps = 0
}: FeeInput) {
  const subtotal = roundCurrency(unitPrice * quantity);
  const platformFee = roundCurrency((subtotal * platformFeeBps) / 10_000);
  const serviceFee = roundCurrency((subtotal * serviceFeeBps) / 10_000);
  const buyerFee = roundCurrency(platformFee + serviceFee);
  const sellerFee = roundCurrency((subtotal * sellerFeeBps) / 10_000);
  const total = roundCurrency(subtotal + buyerFee);

  return {
    subtotal,
    platformFee,
    serviceFee,
    buyerFee,
    sellerFee,
    total
  };
}

export function calculateFromPrismaAmounts(input: {
  unitPrice: unknown;
  quantity?: number;
  platformFeeBps?: number;
  serviceFeeBps?: number;
  sellerFeeBps?: number;
}) {
  return calculateTransparentFees({
    ...input,
    unitPrice: toNumber(input.unitPrice)
  });
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}
