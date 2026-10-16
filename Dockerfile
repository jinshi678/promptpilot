# syntax=docker/dockerfile:1

# ---------- 阶段 1：依赖安装 ----------
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# ---------- 阶段 2：构建 ----------
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 生产使用 PostgreSQL：构建时把 Prisma provider 从 sqlite 切换为 postgresql，
# 并基于切换后的 schema 生成 client（generate 不需要数据库连接）
RUN sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma \
  && npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------- 阶段 3：运行 ----------
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# standalone 产物（含按需裁剪的 node_modules 与 server.js）
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# 静态资源不会被 standalone 自动包含，需手动复制
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Prisma：schema（已切换为 postgresql）+ 查询引擎
# （引擎是动态加载的二进制，standalone 追踪可能遗漏，显式复制保证可用）
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# prisma CLI 供容器启动时执行 db push 建表
RUN npm install -g prisma@6.19.3

USER nextjs
EXPOSE 3000

# 启动前先同步数据库结构（等价于建表），随后启动 Next.js standalone 服务
CMD ["sh", "-c", "prisma db push --schema ./prisma/schema.prisma --skip-generate && node server.js"]
