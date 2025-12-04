# Railway / Render 배포 가이드

이 문서는 Railway 또는 Render를 사용하여 Spring Boot 백엔드와 React + Vite 프론트엔드를 함께 배포하는 방법을 설명합니다.

## 📋 개요

Railway와 Render는 모두 **여러 서비스를 하나의 프로젝트에 배포**할 수 있습니다:
- **백엔드 서비스**: Spring Boot (포트 8080)
- **프론트엔드 서비스**: React + Vite (빌드 후 정적 파일 또는 별도 서비스)
- **데이터베이스**: PostgreSQL (Railway/Render에서 제공)

---

## 🚂 Railway 배포 가이드

### Railway 특징
- ✅ 무료 티어: $5 크레딧/월
- ✅ GitHub 자동 배포
- ✅ 여러 서비스 동시 배포 가능
- ✅ PostgreSQL 데이터베이스 제공
- ✅ 환경 변수 관리
- ✅ 자동 HTTPS

### 배포 구조

```
Railway 프로젝트
├── Backend Service (Spring Boot)
├── Frontend Service (React 빌드)
└── PostgreSQL Database
```

### 단계별 배포 가이드

#### 1. Railway 계정 생성 및 프로젝트 생성

1. [Railway.app](https://railway.app) 접속
2. GitHub로 로그인
3. **"New Project"** 클릭
4. **"Deploy from GitHub repo"** 선택
5. 저장소 선택

#### 2. PostgreSQL 데이터베이스 추가

1. 프로젝트에서 **"+ New"** 클릭
2. **"Database"** → **"Add PostgreSQL"** 선택
3. 데이터베이스가 자동으로 생성됨
4. **"Variables"** 탭에서 연결 정보 확인:
   - `PGHOST`
   - `PGPORT`
   - `PGDATABASE`
   - `PGUSER`
   - `PGPASSWORD`

#### 3. 백엔드 서비스 배포

**방법 1: GitHub 저장소에서 직접 배포 (권장)**

1. 프로젝트에서 **"+ New"** 클릭
2. **"GitHub Repo"** 선택
3. 같은 저장소 선택
4. **"Settings"** 탭에서 설정:

   **Root Directory**: (비워두기 - 루트 디렉토리)
   
   **Build Command**:
   ```bash
   ./gradlew build -x test
   ```
   
   **Start Command**:
   ```bash
   java -jar build/libs/app-0.0.1-SNAPSHOT.jar
   ```

5. **"Variables"** 탭에서 환경 변수 추가:

   ```bash
   # Spring Profile
   SPRING_PROFILES_ACTIVE=postgresql
   
   # 데이터베이스 연결 (Railway PostgreSQL 변수 사용)
   SPRING_DATASOURCE_URL=jdbc:postgresql://${PGHOST}:${PGPORT}/${PGDATABASE}
   SPRING_DATASOURCE_USERNAME=${PGUSER}
   SPRING_DATASOURCE_PASSWORD=${PGPASSWORD}
   
   # 서버 설정
   SERVER_PORT=8080
   SERVER_ADDRESS=0.0.0.0
   
   # JWT Secret (강력한 랜덤 문자열로 변경!)
   APP_JWT_SECRET=your-very-secure-secret-key-minimum-256-bits-change-this
   
   # CORS 허용 (프론트엔드 도메인)
   # 나중에 프론트엔드 URL로 업데이트 필요
   CORS_ALLOWED_ORIGINS=https://your-frontend-url.railway.app
   ```

**방법 2: railway.json 설정 파일 사용**

프로젝트 루트에 `railway.json` 파일 생성:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "./gradlew build -x test"
  },
  "deploy": {
    "startCommand": "java -jar build/libs/app-0.0.1-SNAPSHOT.jar",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### 4. 프론트엔드 서비스 배포

**옵션 A: 정적 파일로 배포 (권장)**

1. 프로젝트에서 **"+ New"** 클릭
2. **"GitHub Repo"** 선택
3. 같은 저장소 선택
4. **"Settings"** 탭에서 설정:

   **Root Directory**: `frontend`
   
   **Build Command**:
   ```bash
   npm ci && npm run build
   ```
   
   **Start Command**:
   ```bash
   npx serve -s dist -l $PORT
   ```
   
   또는 Nginx 사용:
   ```bash
   # nginx.conf 파일 필요 (아래 참고)
   ```

5. **"Variables"** 탭에서 환경 변수 추가:

   ```bash
   # API Base URL (백엔드 서비스 URL)
   VITE_API_BASE_URL=https://your-backend-url.railway.app/api
   PORT=3000
   ```

**옵션 B: Vite 개발 서버로 배포 (개발용)**

1. **Root Directory**: `frontend`
2. **Build Command**: `npm ci`
3. **Start Command**: `npm run dev -- --host 0.0.0.0 --port $PORT`
4. **Variables**: 
   ```bash
   VITE_API_BASE_URL=https://your-backend-url.railway.app/api
   PORT=5173
   ```

#### 5. CORS 설정 업데이트

백엔드의 CORS 설정을 Railway URL에 맞게 업데이트:

**파일**: `src/main/java/com/example/app/config/SecurityConfig.java`

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    
    // Railway 프론트엔드 URL 추가
    String frontendUrl = System.getenv("CORS_ALLOWED_ORIGINS");
    if (frontendUrl != null && !frontendUrl.isEmpty()) {
        configuration.setAllowedOrigins(List.of(
            "http://localhost:5173",
            frontendUrl
        ));
    } else {
        // 기본값
        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
    }
    
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(List.of("*"));
    configuration.setAllowCredentials(true);
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}
```

#### 6. 프론트엔드 API URL 설정

**파일**: `frontend/src/api/client.ts` 수정:

```typescript
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**파일**: `frontend/.env.production` 생성 (Git에 커밋하지 않음):

```bash
VITE_API_BASE_URL=https://your-backend-url.railway.app/api
```

#### 7. 배포 확인

1. Railway 대시보드에서 각 서비스의 **"Deployments"** 탭 확인
2. **"Logs"** 탭에서 로그 확인
3. 프론트엔드 URL로 접속하여 테스트

---

## 🎨 Render 배포 가이드

### Render 특징
- ✅ 무료 티어 제공 (슬립 모드)
- ✅ GitHub 자동 배포
- ✅ PostgreSQL 데이터베이스 제공
- ✅ 자동 HTTPS
- ✅ 환경 변수 관리

### 배포 구조

```
Render 프로젝트
├── Backend Web Service (Spring Boot)
├── Frontend Static Site (React 빌드)
└── PostgreSQL Database
```

### 단계별 배포 가이드

#### 1. Render 계정 생성

1. [Render.com](https://render.com) 접속
2. GitHub로 로그인
3. 대시보드 접속

#### 2. PostgreSQL 데이터베이스 생성

1. **"New +"** → **"PostgreSQL"** 선택
2. 설정:
   - **Name**: `aop-database`
   - **Database**: `aop_db`
   - **User**: `aop`
   - **Region**: 가장 가까운 리전 선택
   - **PostgreSQL Version**: 15 (또는 최신)
   - **Plan**: Free (또는 유료)
3. **"Create Database"** 클릭
4. **"Connections"** 탭에서 연결 정보 확인:
   - **Internal Database URL**: `postgresql://aop:password@dpg-xxx:5432/aop_db`
   - **External Database URL**: 외부 접속용

#### 3. 백엔드 Web Service 배포

1. **"New +"** → **"Web Service"** 선택
2. GitHub 저장소 연결
3. 설정:

   **Name**: `aop-backend`
   
   **Region**: 데이터베이스와 동일한 리전
   
   **Branch**: `main` (또는 배포할 브랜치)
   
   **Root Directory**: (비워두기)
   
   **Runtime**: `Java`
   
   **Build Command**:
   ```bash
   ./gradlew build -x test
   ```
   
   **Start Command**:
   ```bash
   java -jar build/libs/app-0.0.1-SNAPSHOT.jar
   ```

4. **"Advanced"** → **"Add Environment Variable"**:

   ```bash
   SPRING_PROFILES_ACTIVE=postgresql
   SPRING_DATASOURCE_URL=<Internal Database URL>
   SERVER_PORT=8080
   SERVER_ADDRESS=0.0.0.0
   APP_JWT_SECRET=your-very-secure-secret-key-minimum-256-bits
   CORS_ALLOWED_ORIGINS=https://your-frontend-url.onrender.com
   ```

5. **"Create Web Service"** 클릭

#### 4. 프론트엔드 Static Site 배포

1. **"New +"** → **"Static Site"** 선택
2. GitHub 저장소 연결
3. 설정:

   **Name**: `aop-frontend`
   
   **Branch**: `main`
   
   **Root Directory**: `frontend`
   
   **Build Command**:
   ```bash
   npm ci && npm run build
   ```
   
   **Publish Directory**: `dist`

4. **"Add Environment Variable"**:

   ```bash
   VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
   ```

5. **"Create Static Site"** 클릭

#### 5. CORS 설정 업데이트

백엔드의 CORS 설정을 Render URL에 맞게 업데이트 (Railway와 동일):

**파일**: `src/main/java/com/example/app/config/SecurityConfig.java`

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    
    String frontendUrl = System.getenv("CORS_ALLOWED_ORIGINS");
    if (frontendUrl != null && !frontendUrl.isEmpty()) {
        configuration.setAllowedOrigins(List.of(
            "http://localhost:5173",
            frontendUrl
        ));
    } else {
        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
    }
    
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(List.of("*"));
    configuration.setAllowCredentials(true);
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}
```

---

## 🔧 공통 설정 파일

### 1. application-prod.yml 생성

프로덕션 환경 설정 파일 생성:

**파일**: `src/main/resources/application-prod.yml`

```yaml
spring:
  datasource:
    # 환경 변수에서 읽기 (Railway/Render에서 설정)
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME:}
    password: ${SPRING_DATASOURCE_PASSWORD:}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000

  jpa:
    hibernate:
      ddl-auto: validate  # 프로덕션에서는 validate 사용
    show-sql: false  # 프로덕션에서는 false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        jdbc:
          batch_size: 20
          time_zone: Asia/Seoul
    open-in-view: false

server:
  port: ${SERVER_PORT:8080}
  address: ${SERVER_ADDRESS:0.0.0.0}

logging:
  level:
    com.example.app: INFO
    org.springframework: WARN
    org.hibernate: WARN

app:
  jwt:
    secret: ${APP_JWT_SECRET:your-secret-key-change-this-in-production-minimum-256-bits}
    expiration-millis: 3600000
```

### 2. .gitignore 확인

다음 파일들이 Git에 커밋되지 않도록 확인:

```
# 환경 변수 파일
frontend/.env.production
frontend/.env.local

# 빌드 결과물
build/
frontend/dist/
frontend/node_modules/
```

### 3. nginx.conf (프론트엔드 정적 파일 서빙용)

**파일**: `frontend/nginx.conf` (선택사항)

```nginx
server {
    listen $PORT;
    server_name _;
    root /app/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 프록시 (선택사항 - 프론트엔드와 백엔드를 같은 도메인에서 서빙)
    location /api {
        proxy_pass https://your-backend-url.railway.app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🔐 보안 체크리스트

배포 전 확인사항:

- [ ] **JWT Secret 키 변경**: 강력한 랜덤 문자열 사용 (최소 256비트)
- [ ] **데이터베이스 비밀번호**: 기본 비밀번호 변경
- [ ] **CORS 설정**: 허용된 도메인만 지정
- [ ] **환경 변수**: 민감한 정보는 환경 변수로 관리
- [ ] **HTTPS**: Railway/Render는 자동으로 HTTPS 제공
- [ ] **로깅 레벨**: 프로덕션에서는 INFO 이상으로 설정

---

## 🐛 문제 해결

### 백엔드가 시작되지 않을 때

1. **로그 확인**: Railway/Render 대시보드의 "Logs" 탭
2. **빌드 실패**: `build.gradle` 확인, Java 17 설치 확인
3. **데이터베이스 연결 실패**: 환경 변수 확인
4. **포트 충돌**: `SERVER_PORT` 환경 변수 확인

### 프론트엔드가 API를 호출하지 못할 때

1. **CORS 에러**: 백엔드 CORS 설정 확인
2. **API URL**: `VITE_API_BASE_URL` 환경 변수 확인
3. **네트워크 에러**: 백엔드 서비스가 실행 중인지 확인

### 데이터베이스 연결 실패

1. **내부 URL 사용**: Railway/Render의 내부 데이터베이스 URL 사용
2. **환경 변수 확인**: `SPRING_DATASOURCE_URL` 형식 확인
3. **방화벽**: Render의 경우 내부 네트워크 사용

---

## 📊 Railway vs Render 비교

| 기능 | Railway | Render |
|------|---------|--------|
| 무료 티어 | $5 크레딧/월 | 무료 (슬립 모드) |
| 자동 배포 | ✅ | ✅ |
| PostgreSQL | ✅ | ✅ |
| HTTPS | ✅ 자동 | ✅ 자동 |
| 환경 변수 | ✅ | ✅ |
| 로그 | ✅ 실시간 | ✅ 실시간 |
| 슬립 모드 | ❌ | ✅ (무료 티어) |
| 여러 서비스 | ✅ 쉬움 | ✅ 가능 |

---

## 💡 추천 사항

### Railway 선택 시
- 빠른 배포가 필요한 경우
- 무료 크레딧으로 시작
- 여러 서비스를 쉽게 관리

### Render 선택 시
- 완전 무료로 시작 (슬립 모드 허용)
- Static Site로 프론트엔드 배포 (간단)
- 예산이 제한적인 경우

---

## 📚 관련 문서

- [배포 옵션 가이드](deployment-options.md) - 전체 배포 옵션 비교
- [외부 접속 설정](external-access.md) - 로컬 서버 배포
- [데이터베이스 설정](database-setup.md) - PostgreSQL 설정

---

## 🚀 다음 단계

1. **Railway 또는 Render 선택**: 프로젝트 요구사항에 맞는 플랫폼 선택
2. **GitHub 저장소 준비**: 코드가 GitHub에 푸시되어 있는지 확인
3. **환경 변수 준비**: JWT Secret 등 민감한 정보 준비
4. **배포 시작**: 위 가이드에 따라 단계별 배포
5. **테스트**: 배포 후 모든 기능 테스트
6. **모니터링**: 로그 및 성능 모니터링 설정

