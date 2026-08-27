<template>
  <view class="page">
    <view class="card">
      <view class="field">
        <text class="label">供应商名称 <text class="req">*</text></text>
        <input
          v-model="form.name"
          class="input"
          placeholder-class="ph"
          placeholder-style="color: #d1d5db;"
          :disabled="readonly"
          maxlength="64"
          placeholder="请填写名称"
        />
      </view>
      <view class="field">
        <text class="label">联系方式 <text class="req">*</text></text>
        <input
          v-model="form.contact"
          class="input"
          placeholder-class="ph"
          placeholder-style="color: #d1d5db;"
          :disabled="lockProfile"
          maxlength="32"
          placeholder="请填写手机号或电话"
        />
      </view>
      <view class="field">
        <text class="label">地址 <text class="req">*</text></text>
        <input
          v-model="form.address"
          class="input"
          placeholder-class="ph"
          placeholder-style="color: #d1d5db;"
          :disabled="lockProfile"
          maxlength="255"
          placeholder="请填写地址"
        />
      </view>
      <view class="field">
        <text class="label">邮箱</text>
        <input
          v-model="form.email"
          class="input"
          placeholder-class="ph"
          placeholder-style="color: #d1d5db;"
          :disabled="lockProfile"
          maxlength="64"
          placeholder="选填"
        />
      </view>
      <view v-if="readonly && statusText" class="field">
        <text class="label">状态</text>
        <text class="input">{{ statusText }}</text>
      </view>
      <view v-if="readonly && auditRemark" class="field">
        <text class="label">审批说明</text>
        <text class="input">{{ auditRemark }}</text>
      </view>
    </view>
    <button v-if="!readonly" class="submit" :disabled="saving" @click="onSubmit">提交申请</button>
    <button v-if="canEditProfile" class="submit" :disabled="saving" @click="onSaveProfile">保存</button>
    <button v-if="readonly && canCancel" class="cancel" :disabled="saving" @click="onCancel">取消申请</button>
    <button v-if="readonly && canDelete" class="remove" :disabled="saving" @click="onDelete">删除申请</button>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { cancelSupplier, createSupplier, deleteRejectedSupplier, fetchSupplierDetail, updateSupplierProfile } from "@/api/supplier";

const readonly = ref(false);
const saving = ref(false);
const supplierId = ref(0);
const canCancel = ref(false);
const canDelete = ref(false);
const canEditProfile = ref(false);
const lockProfile = computed(() => readonly.value && !canEditProfile.value);
const statusText = ref("");
const auditRemark = ref("");
const form = reactive({
  name: "",
  contact: "",
  email: "",
  address: "",
});

onLoad(async (query) => {
  readonly.value = String((query && query.readonly) || "") === "1";
  const id = Number((query && query.id) || 0);
  supplierId.value = id;
  if (id) {
    uni.setNavigationBarTitle({ title: readonly.value ? "供应商详情" : "编辑供应商" });
    try {
      const res = await fetchSupplierDetail(id);
      form.name = res.data?.name || "";
      form.contact = res.data?.contact || "";
      form.email = res.data?.email || "";
      form.address = res.data?.address || "";
      statusText.value = res.data?.statusText || "";
      auditRemark.value = res.data?.auditRemark || "";
      canCancel.value = !!res.data?.canCancel;
      canDelete.value = !!res.data?.canDelete;
      canEditProfile.value = !!res.data?.canEditProfile;
    } catch (e: any) {
      uni.showToast({ title: e?.message || "加载失败", icon: "none" });
    }
  }
});

async function onSubmit() {
  if (!form.name.trim() || !form.contact.trim() || !form.address.trim()) {
    uni.showToast({ title: "请填写名称、联系方式和地址", icon: "none" });
    return;
  }
  saving.value = true;
  try {
    await createSupplier({
      name: form.name.trim(),
      contact: form.contact.trim(),
      address: form.address.trim(),
      email: form.email.trim() || undefined,
    });
    uni.showToast({ title: "已提交，等待审批", icon: "none" });
    setTimeout(() => uni.navigateBack(), 400);
  } catch (e: any) {
    uni.showToast({ title: e?.message || "提交失败", icon: "none" });
  } finally {
    saving.value = false;
  }
}

async function onSaveProfile() {
  if (!form.contact.trim() || !form.address.trim()) {
    uni.showToast({ title: "请填写联系方式和地址", icon: "none" });
    return;
  }
  saving.value = true;
  try {
    await updateSupplierProfile(supplierId.value, {
      contact: form.contact.trim(),
      address: form.address.trim(),
      email: form.email.trim() || undefined,
    });
    uni.showToast({ title: "已保存", icon: "none" });
    setTimeout(() => uni.navigateBack(), 400);
  } catch (e: any) {
    uni.showToast({ title: e?.message || "保存失败", icon: "none" });
  } finally {
    saving.value = false;
  }
}

function onCancel() {
  uni.showModal({
    title: "取消申请",
    content: `确定取消「${form.name}」的供应商申请？取消后可重新提交。`,
    success: async (res) => {
      if (!res.confirm) {
        return;
      }
      saving.value = true;
      try {
        await cancelSupplier(supplierId.value);
        uni.showToast({ title: "已取消", icon: "none" });
        setTimeout(() => uni.navigateBack(), 400);
      } catch (e: any) {
        uni.showToast({ title: e?.message || "取消失败", icon: "none" });
      } finally {
        saving.value = false;
      }
    },
  });
}

function onDelete() {
  uni.showModal({
    title: "删除申请",
    content: `确定删除「${form.name}」的申请记录？删除后不可恢复。`,
    success: async (res) => {
      if (!res.confirm) {
        return;
      }
      saving.value = true;
      try {
        await deleteRejectedSupplier(supplierId.value);
        uni.showToast({ title: "已删除", icon: "none" });
        setTimeout(() => uni.navigateBack(), 400);
      } catch (e: any) {
        uni.showToast({ title: e?.message || "删除失败", icon: "none" });
      } finally {
        saving.value = false;
      }
    },
  });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f7;
  padding: 24rpx;
}
.card {
  background: #fff;
  border-radius: 20rpx;
  padding: 8rpx 24rpx;
}
.field {
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f3f4f6;
}
.field:last-child {
  border-bottom: none;
}
.label {
  display: block;
  font-size: 24rpx;
  color: #9ca3af;
  margin-bottom: 8rpx;
}
.req {
  color: #ff5a3d;
}
.input {
  font-size: 28rpx;
  color: #111827;
  width: 100%;
}
.ph {
  color: #d1d5db;
}
.submit,
.cancel,
.remove {
  margin-top: 40rpx;
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 42rpx;
  font-size: 28rpx;
}
.submit {
  background: #ff5a3d;
  color: #fff;
}
.cancel,
.remove {
  background: #fff;
  border: 1rpx solid #e5e7eb;
}
.cancel {
  color: #6b7280;
}
.remove {
  color: #b91c1c;
}
</style>
