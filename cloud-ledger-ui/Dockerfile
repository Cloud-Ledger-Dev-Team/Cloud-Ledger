# ======================================================
# Cloud-Ledger 前端 Dockerfile（多阶段构建）
# 阶段一：Node 构建 Vite 产物
# 阶段二：Nginx 静态托管 + 反向代理
# ======================================================

# ---------- 构建阶段 ----------
FROM node:20-alpine AS build
WORKDIR /app

# 先复制依赖清单以利用层缓存
COPY package*.json ./
RUN npm install

# 复制源码并构建
COPY . .
RUN npm run build

# ---------- 运行阶段 ----------
FROM nginx:1.25-alpine

# 拷贝构建产物到 Nginx 静态目录
COPY --from=build /app/dist /usr/share/nginx/html

# 使用自定义 Nginx 配置（SPA 回退 + /api 反向代理）
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
