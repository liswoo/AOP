# 배포 옵션 가이드

이 문서는 AOP 프로젝트를 외부에서 접속할 수 있도록 배포하는 다양한 방법을 설명합니다.

## 📋 배포 옵션 개요

프로젝트를 외부에 배포하는 방법은 크게 다음과 같이 분류할 수 있습니다:

1. **로컬 서버 직접 배포** - 가장 간단하지만 보안과 안정성 고려 필요
2. **클라우드 서비스 (IaaS)** - AWS, Azure, GCP 등
3. **VPS/서버 호스팅** - 전용 서버 또는 VPS 사용
4. **Docker 컨테이너화** - 컨테이너 기반 배포
5. **PaaS (Platform as a Service)** - Heroku, Railway, Render 등

각 옵션의 특징과 장단점을 비교하여 프로젝트에 맞는 방법을 선택하세요.

---

## 1. 로컬 서버 직접 배포

### 개요
현재 개발 중인 컴퓨터를 서버로 사용하여 외부에 노출하는 방법입니다.

### 장점
- ✅ 추가 비용 없음
- ✅ 설정이 간단함
- ✅ 빠르게 테스트 가능

### 단점
- ❌ 컴퓨터가 꺼지면 서비스 중단
- ❌ 보안 위험 (직접 인터넷 노출)
- ❌ 공인 IP 필요 (포트 포워딩)
- ❌ 네트워크 안정성 의존

### 사용 시나리오
- 내부 네트워크에서만 접속
- 프로토타입/데모 목적
- 임시 테스트 환경

### 설정 방법
자세한 내용은 [외부 접속 설정](external-access.md) 문서를 참고하세요.

**주요 단계:**
1. 백엔드 서버 바인딩 주소 변경 (`0.0.0.0`)
2. CORS 설정 수정
3. 방화벽 포트 개방 (8080, 5173)
4. 포트 포워딩 설정 (라우터)

### 보안 권장사항
- ⚠️ **HTTPS 사용 필수** (Let's Encrypt)
- ⚠️ **Nginx 역방향 프록시 사용**
- ⚠️ **강력한 JWT Secret 키**
- ⚠️ **데이터베이스 비밀번호 변경**

---

## 2. 클라우드 서비스 (IaaS)

### 개요
AWS, Azure, GCP 등의 클라우드 인프라를 사용하여 가상 서버를 생성하고 배포하는 방법입니다.

### 주요 제공업체

#### 2.1 AWS (Amazon Web Services)

**서비스 구성:**
- **EC2**: 가상 서버
- **RDS**: PostgreSQL 데이터베이스 (선택사항)
- **S3 + CloudFront**: 프론트엔드 정적 파일 호스팅 (선택사항)
- **Route 53**: 도메인 관리 (선택사항)

**장점:**
- ✅ 확장성 우수
- ✅ 다양한 서비스 통합
- ✅ 글로벌 인프라
- ✅ 자동 백업 및 복구

**단점:**
- ❌ 비용이 높을 수 있음
- ❌ 설정이 복잡함
- ❌ 학습 곡선 존재

**예상 비용:**
- EC2 t3.micro (1년 무료 티어): $0/월 (1년 후 ~$10/월)
- RDS db.t3.micro: ~$15/월
- 총: **무료 ~ $25/월**

**배포 가이드:**
```bash
# 1. EC2 인스턴스 생성 (Ubuntu 22.04 LTS)
# 2. 보안 그룹 설정 (포트 22, 80, 443, 8080)
# 3. SSH 접속
ssh -i your-key.pem ubuntu@your-ec2-ip

# 4. 필수 패키지 설치
sudo apt update
sudo apt install -y openjdk-17-jdk nodejs npm nginx

# 5. 프로젝트 배포
git clone <repository-url>
cd AOP

# 6. 백엔드 빌드 및 실행
./gradlew build
java -jar build/libs/app-0.0.1-SNAPSHOT.jar

# 7. 프론트엔드 빌드
cd frontend
npm install
npm run build

# 8. Nginx 설정 (다음 섹션 참고)
```

#### 2.2 Azure

**서비스 구성:**
- **Virtual Machines**: 가상 서버
- **Azure Database for PostgreSQL**: 데이터베이스
- **Azure App Service**: 웹 앱 호스팅 (선택사항)
- **Azure Static Web Apps**: 프론트엔드 호스팅 (선택사항)

**장점:**
- ✅ Microsoft 생태계 통합
- ✅ 한국 리전 지원
- ✅ 무료 티어 제공

**예상 비용:**
- B1S VM: ~$10/월
- Basic PostgreSQL: ~$25/월
- 총: **~$35/월**

#### 2.3 Google Cloud Platform (GCP)

**서비스 구성:**
- **Compute Engine**: 가상 서버
- **Cloud SQL**: PostgreSQL 데이터베이스
- **Cloud Storage + CDN**: 프론트엔드 호스팅

**장점:**
- ✅ $300 무료 크레딧 제공
- ✅ 우수한 네트워크 성능
- ✅ Kubernetes 통합 용이

**예상 비용:**
- e2-micro: ~$7/월
- Cloud SQL db-f1-micro: ~$10/월
- 총: **~$17/월** (무료 크레딧 사용 시 초기 비용 없음)

---

## 3. VPS/서버 호스팅

### 개요
전용 서버 또는 VPS(Virtual Private Server)를 임대하여 배포하는 방법입니다.

### 주요 제공업체

#### 3.1 DigitalOcean

**장점:**
- ✅ 간단한 가격 정책
- ✅ 우수한 문서화
- ✅ 빠른 서버 생성

**가격:**
- Basic Droplet: $6/월 (1GB RAM, 1 vCPU)
- 데이터베이스: 별도 관리형 서비스 또는 같은 서버에 설치

**배포 예시:**
```bash
# 1. Droplet 생성 (Ubuntu 22.04)
# 2. SSH 접속
ssh root@your-droplet-ip

# 3. 필수 패키지 설치
apt update && apt upgrade -y
apt install -y openjdk-17-jdk nodejs npm nginx postgresql

# 4. 프로젝트 배포 (위 AWS 예시와 동일)
```

#### 3.2 Linode

**가격:**
- Nanode 1GB: $5/월

#### 3.3 Vultr

**가격:**
- Regular Performance: $6/월

#### 3.4 한국 VPS 제공업체

- **카페24**: 한국 서버, 한국어 지원
- **아임웹**: 간편한 관리 패널
- **가비아**: 도메인 + 호스팅 통합

---

## 4. Docker 컨테이너화

### 개요
애플리케이션을 Docker 컨테이너로 패키징하여 배포하는 방법입니다.

### 장점
- ✅ 환경 일관성 (개발/프로덕션 동일)
- ✅ 쉬운 배포 및 확장
- ✅ 컨테이너 오케스트레이션 가능 (Kubernetes, Docker Compose)

### 단점
- ❌ 초기 설정 필요
- ❌ Docker 학습 필요

### Docker Compose 예시

**파일**: `docker-compose.yml` (프로젝트 루트에 생성)

```yaml
version: '3.8'

services:
  # PostgreSQL 데이터베이스
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: aop
      POSTGRES_USER: aop
      POSTGRES_PASSWORD: your-secure-password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U aop"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Spring Boot 백엔드
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/aop
      SPRING_DATASOURCE_USERNAME: aop
      SPRING_DATASOURCE_PASSWORD: your-secure-password
      SERVER_ADDRESS: 0.0.0.0
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  # React 프론트엔드 (빌드된 정적 파일)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  # Nginx 역방향 프록시 (선택사항)
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./frontend/dist:/usr/share/nginx/html:ro
    ports:
      - "443:443"
      - "80:80"
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

**배포 방법:**
```bash
# 1. Docker 및 Docker Compose 설치
# 2. 프로젝트 디렉토리에서 실행
docker-compose up -d

# 3. 로그 확인
docker-compose logs -f

# 4. 중지
docker-compose down
```

### Dockerfile 예시

**파일**: `Dockerfile.backend` (프로젝트 루트)

```dockerfile
FROM openjdk:17-jdk-slim

WORKDIR /app

# Gradle Wrapper 및 소스 복사
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .
COPY src src

# 빌드
RUN chmod +x ./gradlew
RUN ./gradlew build -x test

# 실행
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "build/libs/app-0.0.1-SNAPSHOT.jar"]
```

**파일**: `frontend/Dockerfile.frontend`

```dockerfile
# 빌드 단계
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 실행 단계
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 5. PaaS (Platform as a Service)

### 개요
플랫폼 제공업체가 인프라를 관리하고, 개발자는 코드만 배포하는 방식입니다.

### 주요 제공업체

#### 5.1 Railway

**장점:**
- ✅ 매우 간단한 배포
- ✅ Git 연동 자동 배포
- ✅ 무료 티어 제공 ($5 크레딧/월)

**단점:**
- ❌ 제한적인 커스터마이징
- ❌ 무료 티어는 제한적

**배포 방법:**
1. [Railway.app](https://railway.app) 가입
2. GitHub 저장소 연결
3. 프로젝트 선택
4. 자동으로 빌드 및 배포

**예상 비용:**
- 무료 티어: $5 크레딧/월 (소규모 프로젝트 가능)
- 유료: 사용량 기반

#### 5.2 Render

**장점:**
- ✅ 무료 티어 제공
- ✅ 자동 HTTPS
- ✅ 간단한 설정

**단점:**
- ❌ 무료 티어는 슬립 모드 (첫 요청 시 느림)

**배포 방법:**
1. [Render.com](https://render.com) 가입
2. "New Web Service" 선택
3. GitHub 저장소 연결
4. 빌드 명령어 설정:
   - Build: `./gradlew build`
   - Start: `java -jar build/libs/app-0.0.1-SNAPSHOT.jar`

**예상 비용:**
- 무료 티어: 가능 (슬립 모드)
- 유료: $7/월부터

#### 5.3 Heroku

**장점:**
- ✅ 가장 인기 있는 PaaS
- ✅ 풍부한 애드온
- ✅ 간단한 배포

**단점:**
- ❌ 무료 티어 종료 (2022년 11월)
- ❌ 비용이 높을 수 있음

**예상 비용:**
- Eco Dyno: $5/월
- PostgreSQL: $5/월
- 총: **$10/월**

#### 5.4 Fly.io

**장점:**
- ✅ 전 세계 엣지 서버
- ✅ Docker 기반
- ✅ 무료 티어 제공

**예상 비용:**
- 무료 티어: 3개 앱, 공유 CPU
- 유료: 사용량 기반

---

## 📊 배포 옵션 비교표

| 옵션 | 난이도 | 비용/월 | 확장성 | 보안 | 추천도 |
|------|--------|--------|--------|------|--------|
| 로컬 서버 | ⭐ 쉬움 | $0 | ⭐ 낮음 | ⭐⭐ 낮음 | 프로토타입용 |
| AWS EC2 | ⭐⭐⭐ 어려움 | $10-25 | ⭐⭐⭐ 높음 | ⭐⭐⭐ 높음 | 프로덕션 |
| DigitalOcean | ⭐⭐ 보통 | $6-12 | ⭐⭐ 보통 | ⭐⭐⭐ 높음 | 소규모 프로덕션 |
| Docker | ⭐⭐ 보통 | 서버 비용 | ⭐⭐⭐ 높음 | ⭐⭐⭐ 높음 | 모든 환경 |
| Railway | ⭐ 쉬움 | $0-10 | ⭐⭐ 보통 | ⭐⭐⭐ 높음 | 빠른 배포 |
| Render | ⭐ 쉬움 | $0-7 | ⭐⭐ 보통 | ⭐⭐⭐ 높음 | 소규모 프로젝트 |

---

## 🎯 상황별 추천

### 빠른 프로토타입/데모
→ **Railway** 또는 **Render** (무료 티어)

### 소규모 프로덕션 (예산 제한)
→ **DigitalOcean** 또는 **Vultr** ($6/월)

### 중대형 프로덕션 (확장성 중요)
→ **AWS EC2** 또는 **Docker + Kubernetes**

### 내부 네트워크만 접속
→ **로컬 서버 직접 배포** (Nginx + HTTPS)

### 환경 일관성 중요
→ **Docker 컨테이너화**

---

## 🔧 공통 배포 단계

어떤 옵션을 선택하든 다음 단계는 공통입니다:

### 1. 프로덕션 빌드

**백엔드:**
```bash
./gradlew clean build -x test
# 생성된 JAR: build/libs/app-0.0.1-SNAPSHOT.jar
```

**프론트엔드:**
```bash
cd frontend
npm ci  # package-lock.json 기반 정확한 버전 설치
npm run build
# 생성된 파일: frontend/dist/
```

### 2. 환경 변수 설정

**백엔드:**
- `application-prod.yml` 생성
- JWT Secret 키 변경
- 데이터베이스 연결 정보 설정

**프론트엔드:**
- `.env.production` 생성
- API Base URL 설정

### 3. Nginx 설정 (권장)

자세한 내용은 [외부 접속 설정](external-access.md) 문서의 "5. 프로덕션 배포" 섹션을 참고하세요.

### 4. HTTPS 설정

**Let's Encrypt 사용 (무료):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 5. 프로세스 관리

**systemd 서비스 생성 (Linux):**
```bash
# /etc/systemd/system/aop-backend.service
[Unit]
Description=AOP Backend Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/AOP
ExecStart=/usr/bin/java -jar /home/ubuntu/AOP/build/libs/app-0.0.1-SNAPSHOT.jar
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable aop-backend
sudo systemctl start aop-backend
sudo systemctl status aop-backend
```

---

## 📚 관련 문서

- [외부 접속 설정](external-access.md) - 로컬 서버 배포 상세 가이드
- [데이터베이스 설정](database-setup.md) - PostgreSQL 설정
- [의존성 관리](dependencies.md) - 버전 호환성 가이드

---

## 💡 다음 단계

1. **배포 옵션 선택**: 프로젝트 요구사항과 예산에 맞는 옵션 선택
2. **상세 가이드 확인**: 선택한 옵션의 상세 배포 가이드 참고
3. **테스트 배포**: 스테이징 환경에서 먼저 테스트
4. **모니터링 설정**: 로그, 성능 모니터링 도구 설정
5. **백업 전략**: 데이터베이스 백업 자동화


