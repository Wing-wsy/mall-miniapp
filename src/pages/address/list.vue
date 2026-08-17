<template>
  <view class="page">
    <view v-if="loading" class="state">加载中...</view>
    <view v-else-if="!list.length" class="empty">
      <text class="empty-title">暂无收货地址</text>
      <text class="empty-desc">添加后下单可直接选用</text>
    </view>
    <view v-else class="list">
      <view v-for="item in list" :key="item.id" class="card">
        <view class="card-main" @click="onCard(item)">
          <view class="row-top">
            <text class="name">{{ item.receiverName }}</text>
            <text class="phone">{{ item.receiverPhone }}</text>
            <text v-if="item.isDefault" class="tag">默认</text>
          </view>
          <text class="addr">{{ item.fullAddress }}</text>
        </view>
        <view class="actions">
          <text class="action" @click="onSetDefault(item)">{{ item.isDefault ? "已默认" : "设为默认" }}</text>
          <text class="action" @click="goEdit(item.id)">编辑</text>
          <text class="action danger" @click="onDelete(item)">删除</text>
        </view>
      </view>
    </view>

    <view class="footer">
      <button class="add-btn" @click="goAdd">新增收货地址</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import {
  deleteAddress,
  fetchAddressList,
  setDefaultAddress,
  type AddressVO,
} from "@/api/address";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const list = ref<AddressVO[]>([]);
const loading = ref(false);
const selectMode = ref(false);

onLoad((query) => {
  selectMode.value = (query && query.from) === "order";
  if (selectMode.value) {
    uni.setNavigationBarTitle({ title: "选择收货地址" });
  }
});

onShow(() => {
  if (!userStore.isLogin) {
    uni.redirectTo({ url: "/pages/login/index" });
    return;
  }
  loadList();
});

async function loadList() {
  loading.value = true;
  try {
    const { data } = await fetchAddressList();
    list.value = data || [];
  } catch (e: any) {
    if (e?.code === 401) {
      uni.redirectTo({ url: "/pages/login/index" });
      return;
    }
    uni.showToast({ title: e?.message || "加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function goAdd() {
  uni.navigateTo({ url: "/pages/address/edit" });
}

function onCard(item: AddressVO) {
  if (selectMode.value) {
    uni.setStorageSync("mall_order_address_id", item.id);
    uni.navigateBack();
    return;
  }
  goEdit(item.id);
}

function goEdit(id: number) {
  uni.navigateTo({ url: `/pages/address/edit?id=${id}` });
}

async function onSetDefault(item: AddressVO) {
  if (item.isDefault) return;
  try {
    await setDefaultAddress(item.id);
    uni.showToast({ title: "已设为默认", icon: "success" });
    await loadList();
  } catch (e: any) {
    uni.showToast({ title: e?.message || "操作失败", icon: "none" });
  }
}

function onDelete(item: AddressVO) {
  uni.showModal({
    title: "删除地址",
    content: `确定删除 ${item.receiverName} 的地址吗？`,
    success: async (res) => {
      if (!res.confirm) return;
      try {
        await deleteAddress(item.id);
        uni.showToast({ title: "已删除", icon: "success" });
        await loadList();
      } catch (e: any) {
        uni.showToast({ title: e?.message || "删除失败", icon: "none" });
      }
    },
  });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f7;
  padding-bottom: 160rpx;
  box-sizing: border-box;
}
.state,
.empty {
  padding-top: 200rpx;
  text-align: center;
  color: #9ca3af;
}
.empty-title {
  display: block;
  font-size: 32rpx;
  color: #111827;
  font-weight: 600;
}
.empty-desc {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
}
.list {
  padding: 24rpx;
}
.card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
}
.row-top {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 12rpx;
}
.name {
  font-size: 30rpx;
  font-weight: 700;
  color: #111827;
}
.phone {
  font-size: 28rpx;
  color: #4b5563;
}
.tag {
  font-size: 20rpx;
  color: #ff5a3d;
  border: 1rpx solid #ff5a3d;
  border-radius: 6rpx;
  padding: 2rpx 10rpx;
}
.addr {
  font-size: 26rpx;
  color: #6b7280;
  line-height: 1.5;
}
.actions {
  margin-top: 24rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f3f4f6;
  display: flex;
  justify-content: flex-end;
  gap: 32rpx;
}
.action {
  font-size: 26rpx;
  color: #4b5563;
}
.action.danger {
  color: #ff5a3d;
}
.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 28rpx calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
}
.add-btn {
  margin: 0;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  background: #ff5a3d;
  color: #fff;
  font-size: 30rpx;
}
</style>
