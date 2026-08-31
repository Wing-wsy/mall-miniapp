<template>
  <view class="page">
    <view v-if="loading" class="state">加载中...</view>
    <view v-else>
      <view v-if="home?.showLogin" class="card login">
        <text class="card-title">后台登录信息</text>
        <view class="row">
          <text class="label">登录地址</text>
          <text class="value">{{ home.loginUrl || "—" }}</text>
          <text class="copy" @click="copyField(home.loginUrl, '登录地址')">复制</text>
        </view>
        <view class="row">
          <text class="label">账号</text>
          <text class="value">{{ home.username || "—" }}</text>
          <text class="copy" @click="copyField(home.username, '账号')">复制</text>
        </view>
        <view class="row">
          <text class="label">密码</text>
          <text class="value">{{ maskedPassword }}</text>
          <text class="copy" @click="copyField(home.password, '密码')">复制</text>
        </view>
      </view>

      <view class="hint">
        已提交 {{ usedCount }}/{{ maxPerMember }}，还可提交 {{ remainCount }} 个
      </view>

      <view v-if="!list.length" class="empty">暂无供应商申请</view>
      <view v-for="item in list" :key="item.id" class="card" @click="goDetail(item)">
        <view class="top">
          <text class="name">{{ item.name }}</text>
          <text class="tag" :class="'s' + item.status">{{ item.statusText }}</text>
        </view>
        <text class="meta">{{ item.contact }}</text>
        <text v-if="item.auditRemark" class="remark">{{ item.auditRemark }}</text>
        <view v-if="item.canCancel || item.canDelete" class="actions" @click.stop>
          <text v-if="item.canCancel" class="cancel" @click="onCancel(item)">取消申请</text>
          <text v-if="item.canDelete" class="remove" @click="onDelete(item)">删除</text>
        </view>
      </view>
    </view>

    <view class="footer">
      <button class="add-btn" :disabled="!home?.canApply" @click="goForm">
        {{ home?.canApply ? "申请供应商" : "无法继续申请" }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { fetchSupplierHome, cancelSupplier, deleteRejectedSupplier, type AppSupplierHomeVO, type AppSupplierVO } from "@/api/supplier";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const loading = ref(true);
const home = ref<AppSupplierHomeVO | null>(null);
const list = computed(() => home.value?.list || []);
const maxPerMember = computed(() => {
  const n = Number(home.value?.maxPerMember);
  return Number.isFinite(n) && n >= 0 ? n : 3;
});
const usedCount = computed(() => Number(home.value?.usedCount || 0));
const remainCount = computed(() => Math.max(0, maxPerMember.value - usedCount.value));
const maskedPassword = computed(() => maskMiddle(home.value?.password || ""));

onShow(() => {
  if (!userStore.isLogin) {
    uni.redirectTo({ url: "/pages/login/index" });
    return;
  }
  load();
});

async function load() {
  loading.value = true;
  try {
    const res = await fetchSupplierHome();
    home.value = res.data;
  } catch (e: any) {
    uni.showToast({ title: e?.message || "加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function goForm() {
  if (!home.value?.canApply) {
    uni.showToast({ title: "没有申请资格或已达上限", icon: "none" });
    return;
  }
  uni.navigateTo({ url: "/pages/supplier/form" });
}

function goDetail(item: AppSupplierVO) {
  uni.navigateTo({ url: `/pages/supplier/form?id=${item.id}&readonly=1` });
}

function onCancel(item: AppSupplierVO) {
  uni.showModal({
    title: "取消申请",
    content: `确定取消「${item.name}」的供应商申请？取消后可重新提交。`,
    success: async (res) => {
      if (!res.confirm) {
        return;
      }
      try {
        await cancelSupplier(item.id);
        uni.showToast({ title: "已取消", icon: "none" });
        await load();
      } catch (e: any) {
        uni.showToast({ title: e?.message || "取消失败", icon: "none" });
      }
    },
  });
}

function onDelete(item: AppSupplierVO) {
  uni.showModal({
    title: "删除申请",
    content: `确定删除「${item.name}」的申请记录？删除后不可恢复。`,
    success: async (res) => {
      if (!res.confirm) {
        return;
      }
      try {
        await deleteRejectedSupplier(item.id);
        uni.showToast({ title: "已删除", icon: "none" });
        await load();
      } catch (e: any) {
        uni.showToast({ title: e?.message || "删除失败", icon: "none" });
      }
    },
  });
}

function maskMiddle(raw: string) {
  const text = String(raw || "").trim();
  if (!text) {
    return "—";
  }
  if (text.length <= 4) {
    return `${text[0]}****${text[text.length - 1]}`;
  }
  if (text.length <= 8) {
    return `${text.slice(0, 2)}****${text.slice(-2)}`;
  }
  return `${text.slice(0, 3)}****${text.slice(-3)}`;
}

function copyField(value: string | undefined, label: string) {
  const data = String(value || "").trim();
  if (!data) {
    uni.showToast({ title: `暂无${label}`, icon: "none" });
    return;
  }
  uni.setClipboardData({ data });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f7;
  padding-bottom: 140rpx;
}
.state,
.empty {
  padding-top: 160rpx;
  text-align: center;
  color: #9ca3af;
}
.hint {
  margin: 20rpx 24rpx 0;
  font-size: 24rpx;
  color: #6b7280;
}
.card {
  margin: 20rpx 24rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
}
.card-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
}
.row {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 8rpx 0;
  font-size: 26rpx;
}
.label {
  color: #9ca3af;
  width: 140rpx;
  flex-shrink: 0;
}
.value {
  flex: 1;
  color: #111827;
  word-break: break-all;
}
.copy {
  flex-shrink: 0;
  color: #ff5a3d;
  font-size: 26rpx;
  padding: 0 4rpx;
}
.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}
.name {
  font-size: 30rpx;
  font-weight: 700;
  color: #111827;
}
.tag {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  background: #f3f4f6;
  color: #6b7280;
}
.tag.s0 {
  background: #fff7ed;
  color: #c2410c;
}
.tag.s1 {
  background: #ecfdf5;
  color: #047857;
}
.tag.s2 {
  background: #fef2f2;
  color: #b91c1c;
}
.meta,
.remark {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #6b7280;
}
.remark {
  color: #b91c1c;
}
.actions {
  margin-top: 16rpx;
  display: flex;
  justify-content: flex-end;
}
.cancel {
  font-size: 24rpx;
  color: #6b7280;
  padding: 8rpx 4rpx;
}
.remove {
  font-size: 24rpx;
  color: #b91c1c;
  padding: 8rpx 4rpx;
}
.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16rpx 28rpx 28rpx;
  background: #fff;
}
.add-btn {
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
  background: #ff5a3d;
  color: #fff;
  font-size: 28rpx;
}
.add-btn[disabled] {
  background: #e5e7eb;
  color: #9ca3af;
}
</style>
