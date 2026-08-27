<template>
  <view class="page">
    <view class="card">
      <text class="title">{{ title }}</text>
      <text class="desc">{{ desc }}</text>
      <button v-if="needLogin" class="btn" :loading="loading" @click="goLogin">去登录开通</button>
      <button v-if="needPhone" class="btn" :loading="loading" @click="goLogin">授权手机号</button>
      <button v-if="done" class="btn ghost" @click="goHome">去首页看看</button>
      <button v-if="failed && !needLogin && !needPhone" class="btn ghost" @click="goHome">返回首页</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { useUserStore } from "@/stores/user";
import { redeemMemberLevelInvite } from "@/api/invite";

const CODE_KEY = "mall_level_invite_code";

const userStore = useUserStore();
const code = ref("");
const loading = ref(false);
const done = ref(false);
const failed = ref(false);
const needLogin = ref(false);
const needPhone = ref(false);
const title = ref("开通会员");
const desc = ref("正在确认邀请链接…");
let goingLogin = false;

onLoad((query) => {
  const fromQuery = String((query && query.code) || "").trim();
  if (fromQuery) {
    code.value = fromQuery;
    uni.setStorageSync(CODE_KEY, fromQuery);
  } else {
    code.value = String(uni.getStorageSync(CODE_KEY) || "").trim();
  }
});

onShow(() => {
  if (done.value || loading.value) {
    return;
  }
  setTimeout(() => {
    void tryRedeem();
  }, 50);
});

async function tryRedeem() {
  if (!code.value) {
    failed.value = true;
    title.value = "链接无效";
    desc.value = "未找到邀请信息，请向发送方重新获取链接。";
    return;
  }
  if (!userStore.isLogin) {
    needLogin.value = true;
    needPhone.value = false;
    title.value = "开通会员";
    desc.value = "登录并授权手机号后，即可开通对应会员等级。";
    return;
  }
  if (!userStore.userInfo?.phone) {
    needLogin.value = false;
    needPhone.value = true;
    title.value = "授权手机号";
    desc.value = "会员等级绑定手机号。授权后即可开通。";
    return;
  }

  needLogin.value = false;
  needPhone.value = false;
  loading.value = true;
  title.value = "开通会员";
  desc.value = "正在开通，请稍候…";
  try {
    const res = await redeemMemberLevelInvite(code.value);
    await userStore.refreshProfile();
    const name = res.data?.name || "会员";
    done.value = true;
    failed.value = false;
    title.value = `已成为${name}`;
    desc.value = "会员价已生效，下单时自动按该等级折扣计算。";
    uni.removeStorageSync(CODE_KEY);
    uni.showToast({ title: `已成为${name}`, icon: "success" });
    setTimeout(goHome, 1200);
  } catch (err: any) {
    failed.value = true;
    const message = err?.message || "开通失败";
    if (message.includes("手机号")) {
      needPhone.value = true;
      title.value = "授权手机号";
      desc.value = message;
    } else {
      title.value = "无法开通";
      desc.value = message;
    }
  } finally {
    loading.value = false;
  }
}

function goLogin() {
  if (goingLogin) {
    return;
  }
  goingLogin = true;
  const redirect = encodeURIComponent(`/pages/invite/level?code=${code.value}`);
  uni.navigateTo({
    url: `/pages/login/index?redirect=${redirect}&forcePhone=1`,
    complete: () => {
      goingLogin = false;
    },
  });
}

function goHome() {
  uni.switchTab({ url: "/pages/index/index" });
}
</script>

<style scoped>
.page {
  min-height: 100%;
  background: #f7f7f7;
  padding: 80rpx 48rpx 48rpx;
  box-sizing: border-box;
}
.card {
  width: 100%;
  background: #fff;
  border-radius: 28rpx;
  padding: 64rpx 48rpx;
  box-sizing: border-box;
}
.title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #111827;
}
.desc {
  display: block;
  margin-top: 16rpx;
  font-size: 26rpx;
  color: #6b7280;
  line-height: 1.5;
}
.btn {
  margin-top: 48rpx;
  background: #ff5a3d;
  color: #fff;
  border: none;
  border-radius: 48rpx;
  font-size: 30rpx;
}
.btn.ghost {
  background: #fff;
  color: #111827;
  border: 1px solid #e5e7eb;
}
</style>
