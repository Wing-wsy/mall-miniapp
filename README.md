# mall-miniapp

小程序前端骨架（uni-app Vue3 + TypeScript + Pinia）。

## 启动

```powershell
$env:Path = "D:\nodejs;" + $env:Path
cd D:\mall\mall-miniapp
npm install

# 微信小程序（产物在 dist/dev/mp-weixin，用微信开发者工具打开）
npm run dev:mp-weixin

# 或先用 H5 联调
npm run dev:h5
```

API 基址：`http://127.0.0.1:9081`（见 `src/utils/request.ts`）

## 框架期页面

- Tab：首页 / 分类 / 购物车 / 我的
- `/pages/ping/index`：联调 `mall-app-api` `/ping`

请先启动 `mall-app-api`（9081）。微信开发者工具中需勾选「不校验合法域名」。
