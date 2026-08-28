<template>
  <view class="page">
    <view class="card">
      <text class="title">{{ title }}</text>
      <text class="desc">{{ desc }}</text>
      <button v-if="needLogin" class="btn" :loading="loading" @click="goLogin">去登录</button>
      <button v-if="needPhone" class="btn" :loading="loading" @click="goLogin">授权手机号</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { useUserStore } from "@/stores/user";
import { bindShare } from "@/api/share";

const SC_KEY = "mall_share_sc";
const PID_KEY = "mall_share_pid";

const userStore = useUserStore();
const sc = ref("");
const pid = ref("");
const loading = ref(false);
const needLogin = ref(false);
const needPhone = ref(false);
const title = ref("打开分享");
const desc = ref("正在进入…");
let goingLogin = false;
let done = false;

onLoad((query) => {
  const fromSc = String((query && query.sc) || "").trim();
  const fromPid = String((query && query.pid) || "").trim();
  if (fromSc) {
    sc.value = fromSc;
    uni.setStorageSync(SC_KEY, fromSc);
  } else {
    sc.value = String(uni.getStorageSync(SC_KEY) || "").trim();
  }
  if (fromPid) {
    pid.value = fromPid;
    uni.setStorageSync(PID_KEY, fromPid);
  } else if (fromSc) {
    pid.value = "";
    uni.removeStorageSync(PID_KEY);
  } else {
    pid.value = String(uni.getStorageSync(PID_KEY) || "").trim();
  }
});

onShow(() => {
  if (done || loading.value) {
    return;
  }
  setTimeout(() => {
    void enter();
  }, 50);
});

async function enter() {
  if (!sc.value) {
    title.value = "链接无效";
    desc.value = "未找到分享信息，请向发送方重新获取。";
    return;
  }
  if (!userStore.isLogin) {
    needLogin.value = true;
    needPhone.value = false;
    title.value = "登录后查看";
    desc.value = "登录并授权手机号后即可查看商品。";
    return;
  }
  if (!userStore.userInfo?.phone) {
    needLogin.value = false;
    needPhone.value = true;
    title.value = "授权手机号";
    desc.value = "授权手机号后即可绑定并查看。";
    return;
  }
  needLogin.value = false;
  needPhone.value = false;
  loading.value = true;
  title.value = "正在进入";
  desc.value = "请稍候…";
  try {
    const productId = pid.value ? Number(pid.value) : undefined;
    const res = await bindShare({ sc: sc.value, productId: productId && productId > 0 ? productId : undefined });
    await userStore.refreshProfile().catch(() => undefined);
    done = true;
    uni.removeStorageSync(SC_KEY);
    uni.removeStorageSync(PID_KEY);
    const returnedId = res.data?.productId;
    if (productId && productId > 0 && !(returnedId && returnedId > 0)) {
      uni.showToast({ title: "商品不存在或已下架", icon: "none" });
      setTimeout(() => uni.switchTab({ url: "/pages/index/index" }), 400);
      return;
    }
    goTarget(returnedId && returnedId > 0 ? returnedId : undefined);
  } catch (e: unknown) {
    title.value = "无法打开";
    desc.value = e instanceof Error ? e.message : "分享链接无效";
  } finally {
    loading.value = false;
  }
}

function goTarget(productId?: number) {
  if (productId && productId > 0) {
    uni.redirectTo({
      url: `/pages/goods/detail?id=${productId}`,
      fail: () => {
        uni.showToast({ title: "商品不存在或已下架", icon: "none" });
        uni.switchTab({ url: "/pages/index/index" });
      },
    });
    return;
  }
  uni.switchTab({ url: "/pages/index/index" });
}

function goLogin() {
  if (goingLogin) {
    return;
  }
  goingLogin = true;
  let path = `/pages/share/enter?sc=${encodeURIComponent(sc.value)}`;
  if (pid.value) {
    path += `&pid=${encodeURIComponent(pid.value)}`;
  }
  uni.navigateTo({
    url: `/pages/login/index?redirect=${encodeURIComponent(path)}&forcePhone=1`,
    complete: () => {
      goingLogin = false;
    },
  });
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
  line-height: 1.6;
}
.btn {
  margin-top: 48rpx;
  height: 88rpx;
  line-height: 88rpx;
  background: #ff5a3d;
  color: #fff;
  border-radius: 44rpx;
  font-size: 30rpx;
}
</style>
