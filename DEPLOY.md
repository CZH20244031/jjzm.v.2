# 极境智牧 - 智慧养殖管理平台

## 🚀 快速部署指南

---

### 方式一：Vercel 部署（推荐，免费）

#### 步骤 1：注册账号
1. 打开 [https://vercel.com](https://vercel.com) 注册/登录（支持 GitHub 直接登录）

#### 步骤 2：上传代码
1. 登录后点击 **"Add New..." → Project"**
2. 选择 **"Upload"** 上传本地项目
3. 将整个项目文件夹拖拽上传

#### 步骤 3：配置环境变量
在上传过程中，点击 **"Environment Variables"**，添加：
```
DATABASE_URL = file:/app/data/custom.db
```

#### 步骤 4：部署
1. 框架会自动识别为 Next.js
2. 点击 **"Deploy"** 等待部署完成（约2-3分钟）
3. 部署成功后会得到一个 `xxx.vercel.app` 的域名

#### 步骤 5：初始化数据
部署后访问 `https://你的域名/api/seed` （POST请求）来初始化数据库。

> ⚠️ **注意**：Vercel 的 serverless 环境是只读文件系统，SQLite 不支持持久化。
> 如果用 Vercel，建议将数据库替换为 **Turso**（免费 SQLite 云数据库）或 **PlanetScale**。

---

### 方式二：自有服务器 / 云主机部署（推荐生产使用）

#### 环境要求
- Node.js 20+ 或 Bun 最新版
- 操作系统：Linux（Ubuntu/CentOS）推荐

#### 步骤 1：上传代码到服务器
```bash
# 方式A：用 git（推荐）
cd /var/www
git clone https://github.com/你的用户名/你的仓库.git jjzm
cd jjzm

# 方式B：直接上传 zip 包
scp jjzm.zip root@你的服务器IP:/var/www/
ssh root@你的服务器IP
cd /var/www && unzip jjzm.zip -d jjzm && cd jjzm
```

#### 步骤 2：安装依赖
```bash
cd /var/www/jjzm
npm install
# 或者用 bun（更快）：
bun install
```

#### 步骤 3：配置环境变量
```bash
# 创建 .env 文件
cat > .env << 'EOF'
DATABASE_URL=file:/var/www/jjzm/data/custom.db
EOF

# 创建数据目录
mkdir -p data
```

#### 步骤 4：初始化数据库
```bash
npx prisma db push
```

#### 步骤 5：初始化种子数据
```bash
# 先启动服务器（后台）
NODE_ENV=production npx next start -p 3000 &

# 等待几秒后初始化数据
curl -X POST http://localhost:3000/api/seed
```

#### 步骤 6：构建生产版本
```bash
npx next build
```

#### 步骤 7：启动服务
```bash
# 直接启动
npx next start -p 3000

# 或用 PM2 后台运行（推荐）
npm install -g pm2
pm2 start npm --name "jjzm" -- start
pm2 save
pm2 startup
```

#### 步骤 8：配置 Nginx 反向代理 + HTTPS
```bash
apt install nginx certbot python3-certbot-nginx -y

# 创建 Nginx 配置
cat > /etc/nginx/sites-available/jjzm << 'EOF'
server {
    listen 80;
    server_name 你的域名.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/jjzm /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# 申请免费 HTTPS 证书
certbot --nginx -d 你的域名.com
```

---

### 方式三：Railway 部署（最简单，有免费额度）

1. 打开 [https://railway.app](https://railway.app) 注册登录
2. 点击 **"New Project" → "Deploy from GitHub repo"**
3. 选择你的 GitHub 仓库
4. Railway 会自动检测 Next.js 并配置
5. 添加环境变量：`DATABASE_URL = file:/app/data/custom.db`
6. 点击 Deploy

> ⚠️ Railway 免费额度有限，适合测试。生产建议升级付费。

---

### 方式四：Docker 部署

#### 创建 Dockerfile（项目根目录）
```dockerfile
FROM node:20-alpine AS base

# 安装依赖阶段
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json bun.lock ./
RUN npm install

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npx next build

# 生产阶段
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

#### 构建并运行
```bash
docker build -t jjzm .
docker run -d -p 3000:3000 -v jjzm-data:/app/data jjzm
```

---

## 📁 项目结构说明

```
jjzm/
├── prisma/
│   └── schema.prisma       # 数据库模型定义（12张表）
├── public/
│   ├── images/logo.png     # 你的品牌Logo
│   ├── logo.svg            # SVG备用Logo
│   └── favicon.ico         # 网站图标
├── src/
│   ├── app/
│   │   ├── layout.tsx      # 全局布局
│   │   ├── page.tsx        # 主页面（23个模块入口）
│   │   ├── globals.css     # 全局样式
│   │   └── api/            # 30+ 后端API接口
│   ├── components/         # UI组件
│   │   ├── ui/             # shadcn/ui 基础组件
│   │   ├── dashboard.tsx   # 总览仪表盘
│   │   ├── environment.tsx # 环境智控
│   │   ├── batch-management.tsx # 批次管理
│   │   └── ... (23个功能模块)
│   ├── hooks/              # 自定义Hooks
│   └── lib/                # 工具函数
├── .env                    # 环境变量
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖
└── tailwind.config.ts      # Tailwind CSS 配置
```

## 🔧 常用命令

```bash
npm run dev       # 启动开发服务器
npm run build     # 构建生产版本
npm run start     # 启动生产服务器
npm run lint      # 代码检查
npx prisma db push    # 推送数据库结构
npx prisma studio     # 打开数据库可视化工具
```

## 👤 演示账号

| 角色 | 账号 | 密码 | 权限 |
|------|------|------|------|
| 场长 | admin | admin123 | 全系统管理 |
| 技术员 | tech | tech123 | 数据查看与分析 |
| 兽医 | vet | vet123 | 健康与用药管理 |
| 饲养员 | worker | 123456 | 日常饲喂与巡检 |

## ⚙️ 品牌定制

如需修改品牌名称，搜索替换以下内容：

| 原始内容 | 替换为 |
|----------|--------|
| 极境智牧 | 你的品牌名 |
| 智慧养殖管理平台 | 你的副标题 |

需要修改的文件：
- `src/app/layout.tsx` - 网页标题和描述
- `src/components/app-sidebar.tsx` - 侧边栏品牌名
- `src/components/auth-gate.tsx` - 登录页品牌名
- `src/app/page.tsx` - 页面底部版权

## 🔒 安全建议

1. **生产环境请修改演示密码** — 编辑 `src/components/auth-gate.tsx` 中的 `DEMO_USERS`
2. **添加真实认证系统** — 建议集成 NextAuth.js + 数据库用户表
3. **配置 HTTPS** — 生产环境务必启用 SSL 证书
4. **定期备份数据库** — SQLite 文件在 `data/custom.db`
