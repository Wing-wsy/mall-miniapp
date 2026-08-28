export function salePrice(item?: {
  price?: number | string;
  memberPrice?: number | string | null;
  sharePrice?: number | string | null;
} | null) {
  if (!item) {
    return "";
  }
  if (item.memberPrice != null && item.memberPrice !== "") {
    return item.memberPrice;
  }
  if (item.sharePrice != null && item.sharePrice !== "") {
    return item.sharePrice;
  }
  return item.price;
}

export function linePrice(item?: {
  price?: number | string;
  memberPrice?: number | string | null;
  sharePrice?: number | string | null;
  originPrice?: number | string | null;
} | null) {
  if (!item) {
    return "";
  }
  if (item.memberPrice != null && item.memberPrice !== "") {
    return item.price;
  }
  if (item.sharePrice != null && item.sharePrice !== "") {
    return item.price;
  }
  return item.originPrice;
}
