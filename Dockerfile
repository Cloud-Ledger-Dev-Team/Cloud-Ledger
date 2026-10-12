# ======================================================
# Cloud-Ledger 后端 Dockerfile（多阶段构建）
# 阶段一：Maven 编译打包
# 阶段二：JRE 运行时镜像
# ======================================================

# ---------- 构建阶段 ----------
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# 先复制 pom.xml 以利用 Docker 层缓存拉取依赖
COPY pom.xml .
RUN mvn -q -B dependency:go-offline

# 复制源码并打包（跳过测试）
COPY src ./src
RUN mvn -q -B package -DskipTests

# ---------- 运行阶段 ----------
FROM eclipse-temurin:17-jre
WORKDIR /app

# 复制可执行 jar（finalName 固定为 cloud-ledger.jar）
COPY --from=build /app/target/cloud-ledger.jar app.jar

# 暴露应用端口
EXPOSE 8080

# 默认激活 prod 环境，敏感配置由环境变量注入
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=prod"]
