# Spring Boot 백엔드를 위한 Dockerfile
# Render에서 Java 애플리케이션을 배포하기 위해 사용

# Java 17 기반 이미지 사용
FROM eclipse-temurin:17-jdk-alpine AS build

# 필요한 패키지 설치
RUN apk add --no-cache unzip wget

# Gradle 8.5 설치 (gradle-wrapper.properties에서 확인한 버전)
RUN wget -q https://services.gradle.org/distributions/gradle-8.5-bin.zip && \
    unzip gradle-8.5-bin.zip && \
    mv gradle-8.5 /opt/gradle && \
    rm gradle-8.5-bin.zip

# Gradle을 PATH에 추가
ENV PATH="/opt/gradle/bin:${PATH}"

# 작업 디렉토리 설정
WORKDIR /app

# Gradle 설정 파일 복사
COPY build.gradle .
COPY settings.gradle .
COPY gradle gradle

# 소스 코드 복사
COPY src src

# 애플리케이션 빌드 (테스트 제외)
RUN gradle build -x test --no-daemon

# 실행 단계
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# 빌드된 JAR 파일 복사
COPY --from=build /app/build/libs/app-0.0.1-SNAPSHOT.jar app.jar

# 포트 노출
EXPOSE 8080

# 애플리케이션 실행
ENTRYPOINT ["java", "-jar", "app.jar"]

