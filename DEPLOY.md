# PromptPilot Docker 部署指南

## 前置条件

- Docker 20.10+ 与 Docker Compose v2（`docker compose version` 可验证）
- 模型服务密钥（SiliconFlow 等），仅运行时注入，不进镜像、不进仓库

## 文件清单

| 文件 | 用途 |
| --- | --- |
| `Dockerfile` | 三阶段构建（deps → builder → runner），基于 `output: "standalone"` 产物，非 root 运行 |
| `docker-compose.yml` | 编排 app + postgres:16，含健康检查与数据卷 |
| `.dockerignore` | 排除 node_modules、.next、.env*、dev.db 等，防止密钥与本地数据进镜像 |
| `.env.example` | 环境变量模板 |

## 快速开始

```bash
# 1. 准备环境变量（设置 MODEL_API_KEY，修改 POSTGRES_PASSWORD）
cp .env.example .env

# 2. 构建并启动（首次构建需要几分钟）
docker compose up -d --build

# 3. 验证
curl -I http://localhost:3000          # 首页应返回 200
docker compose ps                      # app 与 db 均应为 healthy
```

应用容器启动时会自动执行 `prisma db push` 在 PostgreSQL 中建表，无需手动迁移。

## 环境变量

| 变量 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `MODEL_API_KEY` | 生产必填 | 空 | 模型服务密钥（`docker-compose.yml` 从宿主机 `.env` 透传） |
| `POSTGRES_PASSWORD` | 建议修改 | `promptpilot_change_me` | PostgreSQL 密码，app 与 db 共用同一值 |
| `MODEL_API_URL` | 否 | `https://api.siliconflow.cn/v1` | OpenAI 兼容模型服务地址 |
| `MODEL_NAME` | 否 | `deepseek-ai/DeepSeek-V3` | 模型名称 |
| `MAX_INPUT_LENGTH` | 否 | `4000` | 输入长度上限（字符） |
| `RATE_LIMIT_PER_MINUTE` | 否 | `20` | 每分钟优化请求上限 |

未设置 `MODEL_API_KEY` 时应用仍可启动，优化请求将返回模拟结果（isMock 标记）。

## 架构说明

- **SQLite → PostgreSQL 切换**：本地开发 `prisma/schema.prisma` 使用 sqlite provider；Docker 构建阶段（builder）用 `sed` 将 provider 替换为 postgresql 后生成 client，运行镜像内即为 PostgreSQL 版 schema。数据库结构与数据模型完全一致，仅驱动不同。
- **建表策略**：当前为 MVP，容器启动时执行 `prisma db push --skip-generate` 同步表结构，数据存于 `pgdata` 具名卷。正式化时建议在本地对 PostgreSQL 生成迁移文件（`prisma migrate dev`），入口改为 `prisma migrate deploy`。
- **standalone 运行时**：`.next/standalone` 已包含裁剪后的 `node_modules` 与 `server.js`；静态资源（`.next/static`、`public`）与 Prisma 查询引擎在 Dockerfile 中显式复制，规避文件追踪遗漏。

## 常用操作

```bash
docker compose logs -f app        # 查看应用日志
docker compose down               # 停止（保留数据卷）
docker compose down -v            # 停止并清空数据库
docker compose up -d --build      # 代码更新后重建
```

## 安全注意事项

- 生产部署务必修改 `POSTGRES_PASSWORD` 默认值。
- `MODEL_API_KEY` 只存在于运行环境；`.dockerignore` 已排除所有 `.env*`，`.gitignore` 已排除 `.env*`（保留 `.env.example` 模板）。
- 若需对外暴露，建议在应用前增加反向代理（Nginx/Caddy）并配置 HTTPS。

## 本地运行 standalone 产物（可选，无需 Docker）

Dockerfile 的 runner 阶段运行的就是 `.next/standalone/server.js`。可以在本机直接运行它做验证：

```bash
npm run build
# 补齐静态资源（与 Dockerfile 中做法一致）
cp -r .next/static .next/standalone/.next/static && cp -r public .next/standalone/public
# 启动（生产模式）
node .next/standalone/server.js
```

**注意**：Prisma 的 SQLite 相对路径（`file:./dev.db`）在 standalone 模式下按生成 client 的目录解析，而不是项目目录，会导致新建空库报 P2021。脱离项目目录运行 standalone 时，`DATABASE_URL` 必须使用绝对路径，例如：

```bash
DATABASE_URL="file:/absolute/path/to/prisma/dev.db" node .next/standalone/server.js
```

Docker 部署不受此影响：容器内使用 PostgreSQL 绝对连接串，且入口会在启动前执行 `prisma db push`。

## 验证状态

- 本机已验证（2026-10-17）：
  - `npm run build` 正常产出 standalone 产物（含 `.next/standalone/server.js`）。
  - 直接运行 standalone 产物（生产模式 + SQLite 绝对路径）烟测 7/7 通过：首页 200、sessions 缺头 400、带头 200、收藏保存 201、相同输入追加版本、列表查询、删除后清空；无密钥时 mock 优化链路正常（isMock=true）。
- 本机未安装 Docker，镜像构建与 `docker compose up` 未实测；在有 Docker 的环境中按上述步骤执行即可，如遇问题可对照 Dockerfile 各阶段定位。
