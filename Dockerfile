# Java 21 공식 OpenJDK 이미지 사용
FROM eclipse-temurin:21-jdk

# 앱 파일 복사: 로컬 JAR → 컨테이너 내부 app.jar
COPY KorUkrTranslator-1.0.2.100.jar app.jar

# Spring Boot가 Render 환경의 PORT 환경변수 사용하도록 설정
ENV SERVER_PORT=${PORT:-8080}

# JAR 실행
CMD ["java", "-jar", "app.jar"]
