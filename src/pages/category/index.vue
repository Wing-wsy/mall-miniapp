<template>
  <view class="page">
    <scroll-view scroll-y class="side">
      <view
        v-for="(item, index) in categories"
        :key="item.id"
        class="side-item"
        :class="{ active: index === active }"
        @click="active = index"
      >
        <view v-if="index === active" class="active-bar" />
        <text>{{ item.name }}</text>
      </view>
    </scroll-view>

    <scroll-view scroll-y class="main">
      <view class="main-title">{{ categories[active].name }}</view>
      <view class="list">
        <view
          v-for="item in categories[active].children"
          :key="item"
          class="list-item"
          @click="toast(item)"
        >
          <view class="thumb">
            <text>{{ item.slice(0, 1) }}</text>
          </view>
          <text class="name">{{ item }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";

const active = ref(0);
const categories = [
  { id: 1, name: "粮油调味", children: ["大米", "食用油", "酱油", "醋", "调味酱"] },
  { id: 2, name: "休闲食品", children: ["坚果", "薯片", "饼干", "糖果", "肉脯"] },
  { id: 3, name: "酒水饮料", children: ["矿泉水", "果汁", "茶叶", "咖啡", "碳酸饮料"] },
  { id: 4, name: "个护清洁", children: ["牙膏", "洗发水", "沐浴露", "洗衣液", "纸巾"] },
  { id: 5, name: "母婴用品", children: ["奶粉", "纸尿裤", "辅食", "湿巾", "玩具"] },
];

function toast(name: string) {
  uni.showToast({ title: name, icon: "none" });
}
</script>

<style scoped>
.page {
  display: flex;
  height: 100vh;
  background: #f7f7f7;
}

.side {
  width: 180rpx;
  background: #f3f4f6;
  height: 100%;
}

.side-item {
  position: relative;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  color: #6b7280;
}

.side-item.active {
  background: #fff;
  color: #111827;
  font-weight: 600;
}

.active-bar {
  position: absolute;
  left: 0;
  top: 30rpx;
  width: 6rpx;
  height: 40rpx;
  border-radius: 0 6rpx 6rpx 0;
  background: #ff5a3d;
}

.main {
  flex: 1;
  height: 100%;
  background: #fff;
  padding: 24rpx 24rpx 40rpx;
  box-sizing: border-box;
}

.main-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #111827;
  margin-bottom: 20rpx;
}

.list {
  display: flex;
  flex-wrap: wrap;
}

.list-item {
  width: 33.33%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32rpx;
}

.thumb {
  width: 110rpx;
  height: 110rpx;
  border-radius: 20rpx;
  background: #fff4f1;
  color: #ff5a3d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: 700;
  margin-bottom: 12rpx;
}

.name {
  font-size: 24rpx;
  color: #4b5563;
}
</style>
