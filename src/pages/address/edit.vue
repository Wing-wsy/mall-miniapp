<template>
  <view class="page">
    <view class="form">
      <view class="field">
        <text class="label">收货人</text>
        <input v-model="form.receiverName" class="input" placeholder="请输入姓名" maxlength="32" />
      </view>
      <view class="field">
        <text class="label">手机号</text>
        <input
          v-model="form.receiverPhone"
          class="input"
          type="number"
          placeholder="请输入手机号"
          maxlength="11"
        />
      </view>
      <picker mode="region" :value="regionValue" @change="onRegionChange">
        <view class="field">
          <text class="label">所在地区</text>
          <text class="picker-value" :class="{ placeholder: !regionText }">
            {{ regionText || "请选择省 / 市 / 区" }}
          </text>
          <text class="arrow">›</text>
        </view>
      </picker>
      <view class="field column">
        <text class="label">详细地址</text>
        <textarea
          v-model="form.detailAddress"
          class="textarea"
          placeholder="街道、门牌号等"
          maxlength="255"
        />
      </view>
      <view class="field switch-row">
        <text class="label">设为默认地址</text>
        <switch :checked="form.isDefault" color="#ff5a3d" @change="onDefaultChange" />
      </view>
    </view>

    <button class="save-btn" :loading="saving" @click="onSave">保存</button>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import {
  createAddress,
  fetchAddressDetail,
  updateAddress,
} from "@/api/address";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const addressId = ref<number | null>(null);
const saving = ref(false);
const form = reactive({
  receiverName: "",
  receiverPhone: "",
  province: "",
  city: "",
  district: "",
  detailAddress: "",
  isDefault: false,
});

const regionValue = computed(() => {
  if (!form.province || !form.city) return [] as string[];
  return [form.province, form.city, form.district || ""];
});

const regionText = computed(() => {
  if (!form.province || !form.city) return "";
  return [form.province, form.city, form.district].filter(Boolean).join(" ");
});

onLoad(async (query) => {
  if (!userStore.isLogin) {
    uni.redirectTo({ url: "/pages/login/index" });
    return;
  }
  const id = Number(query?.id || 0);
  if (id > 0) {
    addressId.value = id;
    uni.setNavigationBarTitle({ title: "编辑地址" });
    await loadDetail(id);
  } else {
    uni.setNavigationBarTitle({ title: "新增地址" });
  }
});

async function loadDetail(id: number) {
  try {
    const { data } = await fetchAddressDetail(id);
    form.receiverName = data.receiverName;
    form.receiverPhone = data.receiverPhone;
    form.province = data.province;
    form.city = data.city;
    form.district = data.district || "";
    form.detailAddress = data.detailAddress;
    form.isDefault = !!data.isDefault;
  } catch (e: any) {
    uni.showToast({ title: e?.message || "加载失败", icon: "none" });
  }
}

function onRegionChange(e: any) {
  const value = (e?.detail?.value || []) as string[];
  form.province = value[0] || "";
  form.city = value[1] || "";
  form.district = value[2] || "";
}

function onDefaultChange(e: any) {
  form.isDefault = !!e?.detail?.value;
}

function validate() {
  if (!form.receiverName.trim()) return "请填写收货人";
  if (!/^1\d{10}$/.test(form.receiverPhone.trim())) return "手机号格式不正确";
  if (!form.province.trim() || !form.city.trim()) return "请选择所在地区";
  if (!form.detailAddress.trim()) return "请填写详细地址";
  return "";
}

async function onSave() {
  const msg = validate();
  if (msg) {
    uni.showToast({ title: msg, icon: "none" });
    return;
  }
  if (saving.value) return;
  saving.value = true;
  const payload = {
    receiverName: form.receiverName.trim(),
    receiverPhone: form.receiverPhone.trim(),
    province: form.province.trim(),
    city: form.city.trim(),
    district: form.district.trim(),
    detailAddress: form.detailAddress.trim(),
    isDefault: form.isDefault,
  };
  try {
    if (addressId.value) {
      await updateAddress(addressId.value, payload);
    } else {
      await createAddress(payload);
    }
    uni.showToast({ title: "保存成功", icon: "success" });
    setTimeout(() => uni.navigateBack(), 400);
  } catch (e: any) {
    uni.showToast({ title: e?.message || "保存失败", icon: "none" });
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f7;
  padding: 24rpx 24rpx 48rpx;
  box-sizing: border-box;
}
.form {
  background: #fff;
  border-radius: 20rpx;
  padding: 8rpx 28rpx;
}
.field {
  min-height: 100rpx;
  display: flex;
  align-items: center;
  border-bottom: 1rpx solid #f3f4f6;
  gap: 24rpx;
}
.field:last-child {
  border-bottom: none;
}
.field.column {
  flex-direction: column;
  align-items: stretch;
  padding: 24rpx 0;
  gap: 16rpx;
}
.field.switch-row {
  justify-content: space-between;
}
.label {
  width: 140rpx;
  font-size: 28rpx;
  color: #111827;
  flex-shrink: 0;
}
.input {
  flex: 1;
  font-size: 28rpx;
  color: #1f2937;
}
.picker-value {
  flex: 1;
  font-size: 28rpx;
  color: #1f2937;
}
.picker-value.placeholder {
  color: #c0c4cc;
}
.arrow {
  color: #d1d5db;
  font-size: 36rpx;
}
.textarea {
  width: 100%;
  min-height: 160rpx;
  font-size: 28rpx;
  color: #1f2937;
}
.save-btn {
  margin-top: 40rpx;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  background: #ff5a3d;
  color: #fff;
  font-size: 30rpx;
}
</style>
