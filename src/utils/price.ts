export function salePrice(item?: {
  price?: number | string;
  memberPrice?: number | string | null;
} | null) {
  if (!item) {
    return "";
  }
  if (item.memberPrice != null && item.memberPrice !== "") {
    return item.memberPrice;
  }
  return item.price;
}

export function linePrice(item?: {
  price?: number | string;
  memberPrice?: number | string | null;
  originPrice?: number | string | null;
} | null) {
  if (!item) {
    return "";
  }
  if (item.memberPrice != null && item.memberPrice !== "") {
    return item.price;
  }
  return item.originPrice;
}
