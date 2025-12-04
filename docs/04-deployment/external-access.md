# 외부 접속 설정

이 가이드는 AOP 프로젝트를 외부 네트워크에서 접속할 수 있도록 설정하는 방법을 설명합니다.

## 1. 백엔드 서버 설정

### 1.1 서버 바인딩 주소 변경

Spring Boot 서버를 모든 네트워크 인터페이스에서 접속 가능하도록 설정합니다.

**파일**: `src/main/resources/application.yml`

```yaml
server:
  port: 8080
  address: 0.0.0.0  # 모든 네트워크 인터페이스에서 접속 허용
```

또는 환경변수로 설정:
```bash
export SERVER_ADDRESS=0.0.0.0
```

### 1.2 CORS 설정 수정

외부 도메인/IP에서 접속할 수 있도록 CORS 설정을 수정합니다.

**파일**: `src/main/java/com/example/app/config/SecurityConfig.java`

**옵션 1: 특정 IP/도메인만 허용 (권장)**
```java
configuration.setAllowedOrigins(List.of(
    "http://localhost:5173",
    "http://YOUR_SERVER_IP:5173",
    "http://yourdomain.com"
));
```

**옵션 2: 모든 도메인 허용 (개발용만, 보안 위험)**
```java
configuration.setAllowedOrigins(List.of("*"));
configuration.setAllowCredentials(false); // "*" 사용 시 false로 설정
```

## 2. 프론트엔드 설정

### 2.1 API Base URL을 환경변수로 관리

**파일**: `frontend/src/api/client.ts`

환경변수를 사용하여 API URL을 동적으로 설정합니다.

```typescript
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**파일**: `frontend/.env.production` (생성 필요)
```
VITE_API_BASE_URL=http://YOUR_SERVER_IP:8080/api
```

**파일**: `frontend/.env.development` (생성 필요)
```
VITE_API_BASE_URL=http://localhost:8080/api
```

### 2.2 Vite 개발 서버 외부 접속 허용

**파일**: `frontend/vite.config.ts`

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // 모든 네트워크 인터페이스에서 접속 허용
    port: 5173,
  },
});
```

## 3. 방화벽 설정

### Windows 방화벽

1. **제어판** → **시스템 및 보안** → **Windows Defender 방화벽**
2. **고급 설정** 클릭
3. **인바운드 규칙** → **새 규칙**
4. **포트** 선택 → **다음**
5. **TCP** 선택, **특정 로컬 포트**: `8080, 5173` 입력
6. **연결 허용** 선택
7. 규칙 이름: "AOP Backend", "AOP Frontend"

또는 PowerShell (관리자 권한):
```powershell
New-NetFirewallRule -DisplayName "AOP Backend" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "AOP Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

### Linux 방화벽 (ufw)

```bash
sudo ufw allow 8080/tcp
sudo ufw allow 5173/tcp
sudo ufw reload
```

## 4. 네트워크 설정

### 4.1 로컬 네트워크 접속

같은 네트워크 내에서 접속하려면:

1. **서버 IP 주소 확인**
   - Windows: `ipconfig`
   - Linux/Mac: `ifconfig` 또는 `ip addr`

2. **프론트엔드에서 접속**
   - `http://YOUR_SERVER_IP:5173`

3. **백엔드 API URL 설정**
   - `.env.production`: `VITE_API_BASE_URL=http://YOUR_SERVER_IP:8080/api`

### 4.2 인터넷을 통한 접속 (포트 포워딩)

공유기/라우터에서 포트 포워딩 설정:

1. **공유기 관리 페이지 접속** (보통 `192.168.0.1` 또는 `192.168.1.1`)
2. **포트 포워딩 설정**
   - 외부 포트: `8080` → 내부 IP: `YOUR_SERVER_IP`, 내부 포트: `8080`
   - 외부 포트: `5173` → 내부 IP: `YOUR_SERVER_IP`, 내부 포트: `5173`
3. **공인 IP 확인**: `https://whatismyipaddress.com/`
4. **외부 접속**: `http://YOUR_PUBLIC_IP:5173`

⚠️ **보안 주의사항**:
- 인터넷에 직접 노출하는 것은 보안 위험이 있습니다.
- 프로덕션 환경에서는 **역방향 프록시(Nginx, Apache)** 사용을 권장합니다.
- **HTTPS** 사용을 권장합니다.

## 5. 프로덕션 배포 (권장)

### 5.1 Nginx 역방향 프록시 설정

**파일**: `/etc/nginx/sites-available/aop`

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # 프론트엔드 (정적 파일)
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 백엔드 API
    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5.2 프론트엔드 빌드

```bash
cd frontend
npm run build
# dist 폴더를 웹 서버에 배포
```

## 6. 보안 체크리스트

- [ ] 강력한 JWT Secret 키 사용
- [ ] 데이터베이스 비밀번호 변경
- [ ] HTTPS 사용 (Let's Encrypt 무료 인증서)
- [ ] 방화벽 규칙 최소화
- [ ] 불필요한 포트 닫기
- [ ] 정기적인 보안 업데이트

## 7. 테스트

### 로컬 네트워크 테스트

1. 서버에서 실행:
   ```bash
   # 백엔드
   ./gradlew bootRun
   
   # 프론트엔드
   cd frontend
   npm run dev
   ```

2. 다른 기기에서 접속:
   - `http://YOUR_SERVER_IP:5173`

### 외부 네트워크 테스트

1. 포트 포워딩 설정 완료 후
2. 외부 기기에서 접속:
   - `http://YOUR_PUBLIC_IP:5173`

## 문제 해결

### 연결이 안 될 때

1. **방화벽 확인**: 포트가 열려있는지 확인
2. **서버 상태 확인**: 서버가 실행 중인지 확인
3. **IP 주소 확인**: 올바른 IP 주소를 사용하는지 확인
4. **포트 확인**: 포트가 사용 중이 아닌지 확인
   ```bash
   # Windows
   netstat -ano | findstr :8080
   
   # Linux/Mac
   lsof -i :8080
   ```

### CORS 에러

- SecurityConfig에서 허용된 Origin 확인
- 프론트엔드에서 사용하는 API URL 확인

## 관련 문서

- [데이터베이스 설정](database-setup.md) - 데이터베이스 설정 가이드
- [백엔드 개요](../02-backend/overview.md) - 백엔드 프로젝트 구조



