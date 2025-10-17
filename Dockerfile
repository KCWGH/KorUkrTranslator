FROM eclipse-temurin:21-jdk
COPY KorUkrTranslator-1.0.2.100.jar
ENV SERVER_PORT=${PORT:-8080}
CMD ["java", "-jar", "KorUkrTranslator-1.0.2.100.jar"]
