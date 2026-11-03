// =============================================
// pricing.ts — Shared delivery rules
// =============================================

export const DELIVERY_CHARGE = 60;
export const FREE_DELIVERY_THRESHOLD = 500;

export function getDeliveryCharge(subtotal: number): number {
    return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
}
