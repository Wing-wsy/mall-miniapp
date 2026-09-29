const KEY = "mall_plan_picking_id";

export function setPickingPlan(id: number) {
  uni.setStorageSync(KEY, id);
}

export function getPickingPlan() {
  const id = Number(uni.getStorageSync(KEY) || 0);
  return id > 0 ? id : 0;
}

export function clearPickingPlan() {
  uni.removeStorageSync(KEY);
}
