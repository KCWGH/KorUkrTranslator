# =========================
# 1️⃣ Build stage - Maven으로 jar 빌드
# =========================
FROM maven:3.9.9-eclipse-temurin-21 AS builder
WORKDIR /app

# 종속성 캐싱 최적화를 위해 pom.xml만 먼저 복사
COPY pom.xml ./
RUN mvn dependency:go-offline -B

# 나머지 소스 복사 및 빌드
COPY src ./src
RUN mvn clean package -DskipTests -B

# =========================
# 2️⃣ Run stage - 빌드된 jar 실행
# =========================
FROM eclipse-temurin:21-jdk
WORKDIR /app

# 빌드 결과물 복사
COPY --from=builder /app/target/*.jar app.jar

# Render에서 제공하는 PORT 환경변수 사용
ENV SERVER_PORT=${PORT:-8080}

# Spring Boot 실행
CMD ["java", "-jar", "app.jar"]
