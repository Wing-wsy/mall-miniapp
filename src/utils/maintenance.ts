/** 与后端 MaintenanceInterceptor.MESSAGE 保持一致 */
export const MAINTENANCE_MESSAGE = "系统维护中，请稍后再试！";

let maintenanceEnabled = false;
let maintenanceBypass = false;
let modalOpen = false;

export function syncMaintenanceFromContact(data?: {
  maintenanceEnabled?: boolean;
  maintenanceBypass?: boolean;
} | null) {
  maintenanceEnabled = !!data?.maintenanceEnabled;
  maintenanceBypass = !!data?.maintenanceBypass;
}

export function isMaintenanceActive(): boolean {
  return maintenanceEnabled && !maintenanceBypass;
}

export function isMaintenanceError(e: unknown): boolean {
  if (e && typeof e === "object" && (e as { maintenance?: boolean }).maintenance === true) {
    return true;
  }
  const msg = e instanceof Error ? e.message : typeof e === "string" ? e : "";
  return msg === MAINTENANCE_MESSAGE;
}

/** 当前页弹窗；不跳转 */
export function notifyMaintenance(message?: string) {
  if (modalOpen) {
    return;
  }
  modalOpen = true;
  uni.showModal({
    title: "提示",
    content: (message && message.trim()) || MAINTENANCE_MESSAGE,
    showCancel: false,
    confirmText: "知道了",
    complete: () => {
      modalOpen = false;
    },
  });
}

/**
 * 跳转详情等页面前拦截：维护中且非白名单 → 当前页弹窗并阻止跳转。
 * 返回 true 表示可以继续跳转。
 */
export function guardMaintenanceNavigate(): boolean {
  if (!isMaintenanceActive()) {
    return true;
  }
  notifyMaintenance();
  return false;
}
