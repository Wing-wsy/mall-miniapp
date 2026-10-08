<template>
  <view class="page">
    <view class="form">
      <view class="avatar-row">
        <text class="label">头像</text>
        <button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar" @click="onAvatarFallback">
          <image v-if="previewAvatar" class="avatar-img" :src="previewAvatar" mode="aspectFill" />
          <view v-else class="avatar-placeholder">{{ avatarLetter }}</view>
          <text class="avatar-tip">点击更换</text>
        </button>
      </view>
      <view class="field">
        <text class="label">昵称</text>
        <input
          class="input"
          type="nickname"
          :value="nickname"
          maxlength="32"
          placeholder="请输入昵称"
          @input="onNicknameInput"
          @blur="onNicknameBlur"
          @change="onNicknameBlur"
        />
      </view>
    </view>

    <button class="save-btn" :loading="saving" @click="onSave">保存</button>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useUserStore } from "@/stores/user";
import { uploadAppFile } from "@/api/file";

const userStore = useUserStore();
const nickname = ref("");
const avatarUrl = ref("");
/** 本地临时路径，选完头像立刻预览，保存时再上传 */
const localAvatar = ref("");
const uploading = ref(false);
const saving = ref(false);

const previewAvatar = computed(() => localAvatar.value || avatarUrl.value || "");
const avatarLetter = computed(() => (nickname.value || "微").slice(0, 1));

onLoad(() => {
  if (!userStore.isLogin) {
    uni.redirectTo({ url: "/pages/login/index" });
    return;
  }
  nickname.value = userStore.userInfo?.nickname || "";
  avatarUrl.value = userStore.userInfo?.avatarUrl || "";
});

function onNicknameInput(e: any) {
  nickname.value = String(e?.detail?.value ?? "");
}

function onNicknameBlur(e: any) {
  const value = String(e?.detail?.value ?? nickname.value).trim();
  nickname.value = value;
}

/** 微信 chooseAvatar：e.detail.avatarUrl 为临时文件路径 */
async function onChooseAvatar(e: any) {
  const path = String(e?.detail?.avatarUrl || "").trim();
  if (!path) {
    return;
  }
  localAvatar.value = path;
}

/**
 * 非微信环境（H5 / 开发者工具部分场景）open-type=chooseAvatar 无效时，
 * 用选图兜底；真机微信里会先触发 chooseavatar，此处再选一次也可接受。
 */
function onAvatarFallback() {
  // #ifdef H5
  pickLocalAvatar();
  // #endif
}

function pickLocalAvatar() {
  uni.chooseImage({
    count: 1,
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
    success: (res) => {
      const path = res.tempFilePaths?.[0];
      if (path) {
        localAvatar.value = path;
      }
    },
  });
}

function validate() {
  const name = nickname.value.trim();
  if (!name) {
    return "请填写昵称";
  }
  if (name.length > 32) {
    return "昵称不能超过32个字";
  }
  return "";
}

async function onSave() {
  const msg = validate();
  if (msg) {
    uni.showToast({ title: msg, icon: "none" });
    return;
  }
  if (saving.value || uploading.value) {
    return;
  }
  saving.value = true;
  try {
    let nextAvatar = avatarUrl.value;
    if (localAvatar.value) {
      uploading.value = true;
      const uploaded = await uploadAppFile(localAvatar.value, "avatar");
      nextAvatar = uploaded.url;
      uploading.value = false;
    }
    await userStore.saveProfile({
      nickname: nickname.value.trim(),
      avatarUrl: nextAvatar || undefined,
    });
    uni.showToast({ title: "保存成功", icon: "success" });
    setTimeout(() => uni.navigateBack(), 400);
  } catch (e: any) {
    uploading.value = false;
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
.avatar-row {
  min-height: 160rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid #f3f4f6;
}
.avatar-btn {
  margin: 0;
  padding: 16rpx 0;
  background: transparent;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  line-height: 1.2;
}
.avatar-btn::after {
  border: none;
}
.avatar-img,
.avatar-placeholder {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
}
.avatar-img {
  background: #f3f4f6;
}
.avatar-placeholder {
  background: #ff5a3d;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
  font-weight: 700;
}
.avatar-tip {
  font-size: 22rpx;
  color: #9ca3af;
}
.field {
  min-height: 100rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
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
  text-align: right;
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
