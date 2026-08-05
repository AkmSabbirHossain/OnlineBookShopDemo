
export const StockChangeReason = {
    ManualAdjustment: 0,
    Sale: 1,
    NewPurchase: 2,
    CustomerReturn: 3,
    Damage: 4
} as const;

export type StockChangeReason = typeof StockChangeReason[keyof typeof StockChangeReason];

export interface StockHistoryResponseDto {
    stockHistoryId: number;
    bookId: number;
    bookTitle: string;
    oldStock: number;
    newStock: number;
    reason: string;
    changedBy: string;
    changedAt: string; 
    notes?: string | null;
    referenceId?: number | null;
    referenceType?: string | null;
    changeReason?: StockChangeReason;
}