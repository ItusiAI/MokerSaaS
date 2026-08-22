# MokerSaaS

<div align="center">

![MokerSaaS Logo](public/logo.png)

**🚀 极速构建 SaaS，** · **数小时完成产品上线。**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Stripe](https://img.shields.io/badge/Stripe-Integrated-635BFF?style=flat-square&logo=stripe)](https://stripe.com/)

[🌟 在线演示](https://mokersaas.com) · [🚀 快速开始](#-快速开始--quick-start) · [📦 项目结构](#-项目结构--project-structure)

</div>

---

> **极速构建 SaaS，数天出海收款。** Ship your SaaS at light speed, earn globally in days.

MokerSaaS 是一个面向出海团队的 SaaS 启动模版，集成用户认证、Stripe 订阅与积分、推广返利与推荐奖励、邮件营销、管理后台、五语与 SEO 等功能。技术栈基于 Next.js 16 + PostgreSQL + Drizzle ORM，可直接部署到 Vercel。线上演示 → **[mokersaas.com](https://mokersaas.com)**

## ✨ 核心功能 | Core Features

### 🔐 完整的用户认证系统
- 邮箱密码登录，含邮箱验证、密码重置、Resend 邮件投递
- Google / GitHub OAuth 自动绑定账户
- NextAuth.js + JWT 会话管理，支持关联账号查询

### 💳 Stripe 支付与积分系统
- 订阅计费：Trial / Pro Monthly / Annual 三档
- 积分购买：Stripe Checkout 一次性付款，Webhook 自动入账
- 客户门户：自助管理订阅、发票、退款
- `lib/points-manager.ts` 统一消费、退还、过期流水

### 🌐 多语言与 SEO
- 内置中 / 英 / 日 / 韩 / 繁五语（`next-intl`），URL 形如 `/zh/...` `/en/...` `/ja/...` `/ko/...` `/tw/...`
- 完整 i18n 元数据、hreflang、`sitemap.xml`、JSON-LD 结构化数据
- Open Graph 与 Twitter Card 分享预览

### 📣 推广返利（Affiliate）
- 用户生成专属推广码，1%–20% 多档佣金比例
- 冻结 / 释放 / 取消三态流水，提现审核工作流
- 推广关系追踪、佣金记录、可视化统计

### 🎁 推荐奖励（Referral）
- 注册时通过 `?ref=CODE` 绑定推荐关系
- 双方奖励积分、订阅天数延长
- 推荐码可自定义一次，支持防滥用过期

### 📊 管理员后台
- 6 大模块：概览 / 流量 / 用户 / 邮件订阅 / 推荐 / 返利
- Umami Analytics 集成，实时查看站点流量
- 用户积分调整、订阅管理、订阅推送审核

### 📧 邮件与营销
- Resend 邮件模板：验证、重置、支付成功、订阅确认
- Newsletter 订阅统计、退订流程（`/newsletter/unsubscribe`）
- 网站底部订阅入口，自动同步到 `newsletter_subscriptions` 表

### 🛡️ 安全与稳定性
- bcryptjs 密码哈希、Zod 输入校验
- 角色权限（`user` / `admin`），管理员路由受 `requireAdmin()` 守卫
- 环境变量隔离，敏感配置走 `.env.local`

### 📅 订阅到期提醒（邮件自动化）
- Cron Job 自动扫描到期用户，提前 7 天 / 3 天 / 当天各发一封邮件
- 用户可一键关闭全部提醒（`subscriptionReminderDisabled`），每封邮件含独立退订链接
- 管理后台独立 Tab 查看所有发送记录（类型 / 时间 / 语言 / 计划 / 主题）
- 支持中 / 英 / 日 / 韩 / 繁五语邮件偏好（`preferredLanguage`）

### 🛌 沉睡用户召回（Re-engagement）
- **5 段分桶**自动识别用户沉睡天数：`active (<7d)` → `warm (7-30d)` → `dormant (30-90d)` → `inactive (90-180d)` → `churned (>180d)`
- 顶部 8 张统计卡片实时展示全量用户、未激活账号、各桶人数、沉睡+曾付费用户，全部加总可与 `users` 表对账
- **多维度筛选**：分桶 / 语言 / 订阅状态（从未 / 当前 / 历史）/ 注册渠道 / 关键字搜索 + 多种排序
- **批量召回活动（Campaign）**：基于分桶 + 筛选条件构建目标人群，预览实际可发送数量（自动排除邮箱未验证、当前有效订阅、黑名单用户），分批发送召回邮件，每批间隔节流防频控
- **黑名单机制**：单个 campaign 内已发过同类邮件 / 全局退订 / 历史硬退的用户自动跳过，避免打扰
- **发送日志**：记录每封邮件的目标用户 / 模板 / 发送状态 / 失败原因，支持重试与统计
- 数据表：`reengagement_campaigns`、`reengagement_logs`、`reengagement_excluded_users`
- 触发入口：管理后台 → 用户管理 → "沉睡召回" Tab

## 📸 功能预览 | Feature Preview

<div align="center">

| 首页 | 认证 | 订阅 |
|:---:|:---:|:---:|
| ![Home](public/images/homehaibao.png) | ![Auth](public/images/auth-demo.png) | ![Subscription](public/images/subscription-demo.png) |

| 个人资料 | 推荐 | 推广 |
|:---:|:---:|:---:|
| ![Profile](public/images/profile-demo.png) | ![Referral](public/images/referral-demo.png) | ![Affiliate](public/images/affiliate-demo.png) |

| 积分 | 管理后台 |
|:---:|:---:|
| ![Credits](public/images/Credits-demo.png) | ![Admin](public/images/admin-demo.png) |

</div>

## 🛠️ 技术栈 | Tech Stack

| 层 | 技术 |
|---|---|
| 前端框架 | Next.js 16 (App Router) · React 19 · TypeScript 5 |
| 样式 | Tailwind CSS 3 · Radix UI · shadcn/ui 风格组件 |
| 表单 | React Hook Form · Zod · `react-icons` |
| 国际化 | `next-intl` · `messages/{en,zh,ja,ko,tw}.json` |
| 后端 | Next.js API Routes · Server Actions |
| 数据库 | PostgreSQL · Drizzle ORM · `drizzle-kit` 迁移 |
| 认证 | NextAuth.js v4 · `@auth/drizzle-adapter` |
| 支付 | Stripe (`@stripe/stripe-js` + `stripe`) |
| 邮件 | Resend |
| 图表 | Recharts |
| 部署 | Vercel · Railway · Netlify |

## 🚀 快速开始 | Quick Start

### 📋 环境要求
- Node.js 18+（推荐 20 LTS）
- PostgreSQL 14+（推荐 Neon Serverless）
- Stripe 账户（订阅 + 积分都需要）
- Resend 账户（邮件投递）
- Google / GitHub OAuth 应用（可选）

### 1. 克隆项目
```bash
git clone <https://github.com/ItusiAI/MokerSaaS>
cd moker-saas
```

### 2. 安装依赖
```bash
npm install
# 或
pnpm install
```

### 3. 环境配置

复制 `.env.example`（如有）或直接新建 `.env.local`，填写以下环境变量：

```dotenv
# 数据库
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<openssl rand -base64 32>"

# Resend 邮件
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="Your Brand <noreply@yourdomain.com>"
RESEND_BRAND_NAME="Your Brand"
RESEND_ADMIN_EMAIL="admin@yourdomain.com"

# Stripe
STRIPE_SECRET_KEY="sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxx"

# Stripe 价格 ID
STRIPE_TRIAL_PRICE_ID="price_xxxxxxxxxxxxxxxxxx"
STRIPE_PRO_PRICE_ID="price_xxxxxxxxxxxxxxxxxx"
STRIPE_ANNUAL_PRICE_ID="price_xxxxxxxxxxxxxxxxxx"
STRIPE_POINTS_STARTER_PRICE_ID="price_xxxxxxxxxxxxxxxxxx"
STRIPE_POINTS_POPULAR_PRICE_ID="price_xxxxxxxxxxxxxxxxxx"
STRIPE_POINTS_PREMIUM_PRICE_ID="price_xxxxxxxxxxxxxxxxxx"

# OAuth
GOOGLE_CLIENT_ID="<your-google-client-id>"
GOOGLE_CLIENT_SECRET="<your-google-client-secret>"
GITHUB_ID="<your-github-id>"
GITHUB_SECRET="<your-github-secret>"

# Umami 流量分析（管理员后台使用，可选）
NEXT_PUBLIC_UMAMI_WEBSITE_ID="your-website-id"
NEXT_PUBLIC_UMAMI_SCRIPT_URL="https://cloud.umami.is/script.js"
UMAMI_API_URL="https://cloud.umami.is/api"
UMAMI_API_KEY="your-api-key"
# 自部署 Umami 可选用户名密码
# UMAMI_USERNAME="admin"
# UMAMI_PASSWORD="your-password"

# 应用
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Cron 提醒（可选，Vercel Cron Job 调用）
CRON_SECRET="<openssl rand -base64 32>"
```

### 4. 数据库初始化
```bash
# 推 schema 到数据库（开发环境）
npm run db:push

# 或生成迁移文件后执行（生产环境推荐）
npm run db:generate
npm run db:migrate

# 打开 Drizzle Studio 可视化管理
npm run db:studio
```

### 5. 提升第一个管理员
启动 dev server 后调用 API 把目标邮箱设为管理员：

```bash
curl -X POST "http://localhost:3000/api/admin/set-admin" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@yourdomain.com"}'
```

### 6. 启动开发服务器
```bash
npm run dev
```

访问 `http://localhost:3000`，使用管理员账号登录后访问 `http://localhost:3000/zh/admin` 进入管理后台。

## 📁 项目结构 | Project Structure

```
├── app/                                # Next.js App Router
│   ├── [locale]/                       # 国际化路由
│   │   ├── admin/                      # 管理后台控制台
│   │   ├── affiliate/                  # 推广返利页面
│   │   ├── auth/                       # 认证流程（signin / signup / forgot / reset / verify / error）
│   │   ├── cookies/                    # Cookie 政策
│   │   ├── dashboard/                  # 支付成功页
│   │   ├── newsletter/                 # 退订页
│   │   ├── privacy/                    # 隐私政策
│   │   ├── profile/                    # 用户中心
│   │   ├── referral/                   # 推荐奖励页面
│   │   ├── terms/                      # 服务条款
│   │   ├── unauthorized/               # 权限不足页
│   │   ├── layout.tsx                  # 共享布局（SiteChrome + Navbar + Footer）
│   │   └── page.tsx                    # 首页（Hero / Orchestration / MissionControl / Pricing / FAQ）
│   ├── api/                            # API 路由
│   │   ├── admin/                      # 管理员 API（users / affiliates / referrals / statistics / set-admin / analytics / reengagement）
│   │   ├── affiliate/                  # 推广（stats / relations / earnings / update-code / withdraw / withdrawals）
│   │   ├── auth/                       # NextAuth + 邮箱验证 / 重置 / 注册 / OAuth 绑定
│   │   ├── newsletter/                 # 订阅 / 退订
│   │   ├── points/                     # 积分流水
│   │   ├── referral/                   # 推荐（stats / records / rewards / update-code）
│   │   ├── stripe/                     # 支付（checkout / create-checkout-session / customer-portal / webhook）
│   │   └── user/                       # 用户资料 / 订阅 / 积分 / 推荐 / 关联账号
│   ├── cron/                           # Cron Job（订阅到期提醒）
│   ├── globals.css                     # 全局样式
│   ├── layout.tsx                      # 根布局
│   ├── page.tsx                        # 根路由重定向
│   └── sitemap.ts                      # 自动生成 sitemap.xml
├── components/
│   ├── admin/                          # 管理后台模块（dashboard / user-stats / newsletter / referral / affiliate / traffic / reengagement-list / reengagement-campaigns）
│   ├── affiliate/                      # 推广返利页面组件
│   ├── auth/                           # 登录 / 注册 / 验证表单 + OAuth handler
│   ├── home/                           # 首页 Section（Hero / Navbar / Footer / Pricing / MissionControl / Orchestration / FAQ / Validation）
│   ├── profile/                        # 用户中心子组件
│   ├── referral/                       # 推荐页面组件
│   ├── ui/                             # 基础 UI 组件库（Radix UI 封装）
│   └── seo/analytics.tsx               # Umami 追踪脚本
├── drizzle/                            # 数据库迁移
│   ├── 0000_*.sql ~ 0009_*.sql         # 14 份迁移文件（含 reengagement 系统）
│   ├── add_performance_indexes.sql
│   └── meta/                           # Drizzle 元数据
├── lib/
│   ├── auth.ts                         # NextAuth 配置
│   ├── auth-utils.ts                   # requireAdmin / requireUser 等守卫
│   ├── db.ts                           # Drizzle 数据库连接
│   ├── schema.ts                       # 数据库表结构
│   ├── stripe.ts                       # Stripe 客户端
│   ├── payments.ts                     # 订阅 / Checkout 封装
│   ├── points.ts                       # 积分 API
│   ├── points-manager.ts               # 积分流水 + 过期处理
│   ├── referral.ts                     # 推荐奖励发放
│   ├── affiliate.ts                    # 推广返利计算
│   ├── email.ts                        # Resend 邮件模板
│   ├── reengagement-buckets.ts         # 沉睡分桶阈值与 SQL 表达式
│   ├── seo-config.ts                   # 多语言 SEO 元数据
│   └── utils.ts                        # 通用工具（cn / dateFmt / currency）
├── messages/
│   ├── en.json                         # 英文翻译
│   ├── zh.json                         # 中文翻译（简体）
│   ├── tw.json                         # 中文翻译（繁体）
│   ├── ja.json                         # 日文翻译
│   └── ko.json                         # 韩文翻译
├── public/                             # 静态资源
│   ├── images/                         # 海报、演示截图
│   ├── logo.png
│   ├── manifest.json
│   └── robots.txt
├── components.json                     # shadcn/ui 配置
├── drizzle.config.ts                   # Drizzle Kit 配置
├── next.config.mjs                     # Next.js 配置
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 🔧 可用脚本 | Available Scripts

```bash
npm run dev          # 启动开发服务器（http://localhost:3000）
npm run build        # 生产构建
npm run start        # 启动生产服务器
npm run lint         # ESLint 代码检查

npm run db:push      # 推送 schema 到数据库（开发）
npm run db:generate  # 生成迁移文件
npm run db:migrate   # 执行迁移（生产）
npm run db:studio    # 打开 Drizzle Studio 可视化管理
```

## 🎯 主要页面 | Main Pages

### 👤 用户页面
| 路径 | 说明 |
|---|---|
| `/` | 首页（产品介绍 + 定价 + FAQ） |
| `/auth/signin` | 登录 |
| `/auth/signup` | 注册（支持 `?ref=CODE` 推荐 + `?aff=CODE` 推广） |
| `/auth/forgot-password` | 忘记密码 |
| `/auth/reset-password` | 重置密码 |
| `/auth/verify-email` | 邮箱验证 |
| `/auth/error` | 认证错误回调 |
| `/profile` | 用户中心（资料 / 订阅 / 推荐 / 支付历史） |
| `/dashboard` | 支付成功落地页 |
| `/referral` | 推荐计划（我的推荐码 / 奖励记录） |
| `/affiliate` | 推广返利（推广码 / 佣金 / 提现） |
| `/newsletter/unsubscribe` | 邮件退订 |
| `/terms` · `/privacy` · `/cookies` | 法务政策 |
| `/unauthorized` | 权限不足 |

### 🛡️ 管理后台
- `/admin` → 7 大模块：概览、流量、用户、邮件订阅、推荐、返利、提醒日志
- URL hash 切换：`/#overview` `/#traffic` `/#users` `/#newsletter` `/#referral` `/#affiliate` `/#reminders`

### 🔗 API 端点

| 路径 | 说明 |
|---|---|
| `/api/auth/*` | NextAuth、`register`、`verify-email`、`forgot-password`、`reset-password`、`oauth-affiliate`、`oauth-referral` |
| `/api/stripe/*` | `checkout`、`create-checkout-session`、`customer-portal`、`webhook` |
| `/api/user/*` | `profile`、`subscription`、`points`、`points/deduct`、`change-password`、`connected-accounts`、`payments`、`referral` |
| `/api/admin/*` | `users`、`users/[userId]`、`set-admin`、`affiliates`、`referrals`、`statistics`、`analytics/umami` |
| `/api/affiliate/*` | `stats`、`relations`、`earnings`、`update-code`、`withdraw`、`withdrawals` |
| `/api/referral/*` | `stats`、`records`、`rewards`、`update-code` |
| `/api/newsletter/*` | `subscribe`、`unsubscribe` |
| `/api/points/*` | `history` |
| `/api/cron/reminders` | 订阅到期提醒 Cron（需 CRON_SECRET 鉴权） |

## 💰 商业模式 | Business Model

### 订阅
- **Trial**：`STRIPE_TRIAL_PRICE_ID`（按需配置）
- **Pro Monthly**：`$15.9/月`（原价 `$19.9`）
- **Annual**：`STRIPE_ANNUAL_PRICE_ID`

### 积分（一次性购买）
| 套餐 | 积分 | 价格 |
|---|---|---|
| Starter | 500 | $8 |
| Popular | 1,000 | $15 |
| Premium | 15,000 | $150 |

### 推荐奖励
- 注册时通过 `?ref=CODE` 绑定，双方奖励积分 + 订阅天数

### 推广返利
- 用户可设置 1 次专属推广码
- 佣金比例与冻结期可在 `lib/affiliate.ts` 调整

## 🔒 安全特性 | Security Features

- **密码哈希**：`bcryptjs` 加盐
- **会话管理**：NextAuth JWT
- **数据校验**：Zod schema 校验所有 API 输入
- **角色守卫**：`requireAdmin()` 保护管理员路由
- **CSRF / Webhook 签名**：Stripe Webhook 验签
- **环境隔离**：敏感配置仅走 `.env.local`

## 📈 SEO 优化 | SEO Optimization

- 每个页面 `generateMetadata` 动态生成标题、描述、hreflang
- 多语言 `sitemap.xml` 自动生成
- JSON-LD 结构化数据（Organization / Product）
- Open Graph + Twitter Card
- 图片 `next/image` 懒加载与 WebP
- 关键 CSS 内联、字体按需加载

## 🚀 部署指南 | Deployment Guide

### Vercel（推荐）
1. 将仓库 Fork 到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 在项目设置中填入环境变量（与 `.env.local` 一致）
4. 部署完成，后续 push 自动触发构建

### Railway / Netlify / DigitalOcean
- 确保设置构建命令 `npm run build`、输出目录 `.next`
- 数据库需使用外部 PostgreSQL（推荐 Neon / Supabase / Railway）
- Stripe Webhook 需要配置到生产域名

### 上线前检查清单
- [ ] 替换 `NEXTAUTH_SECRET` 为强随机字符串
- [ ] Stripe 切换到 Live 模式 + 真实 Webhook
- [ ] Resend 域名 DNS 验证
- [ ] OAuth 回调地址更新为生产域名
- [ ] `NEXT_PUBLIC_APP_URL` 改为 `https://`
- [ ] 关闭 `npm run dev`，使用 `npm run start` 启动生产

## 🤝 贡献 | Contributing

1. Fork 本项目
2. 创建功能分支：`git checkout -b feature/awesome`
3. 提交代码：`git commit -m 'feat: add awesome feature'`
4. 推送分支：`git push origin feature/awesome`
5. 提交 Pull Request

请遵循现有代码风格，公共组件与 API 同步更新五语翻译。

## 📄 许可证 | License

MIT License — 详见 [LICENSE](LICENSE) 文件。

## 📞 支持与社区 | Support & Community

- 📖 [项目主页](https://mokersaas.com)
- 📘 [环境变量配置文档](https://getmoney.wang/zh/article/MokerSaaS)
- 📧 邮箱：app@itusi.cn
- 🐛 提交 Issue：GitHub Issues
- 🐦 Twitter：[@zyailive](https://twitter.com/zyailive)

---

<div align="center">

**🎉 感谢使用 MokerSaaS！如果对您有帮助，请给一个 ⭐ Star！**

**Built with Next.js 16 · PostgreSQL · Stripe · Drizzle ORM**

</div>
