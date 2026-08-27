export const THIRD_PARTY_LABEL = "非自营";

export function publicShipFrom(item?: {
  selfOperated?: boolean;
  supplierId?: number | null;
  shipFromLabel?: string;
  supplierName?: string;
}) {
  if (!item) {
    return "自营";
  }
  if (item.selfOperated === false || (item.supplierId != null && item.supplierId !== 0)) {
    return THIRD_PARTY_LABEL;
  }
  return item.shipFromLabel || item.supplierName || "自营";
}
