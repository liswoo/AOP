# 프로젝트 아키텍처 도식표

이 문서는 다른 AI가 프로젝트를 빠르게 이해할 수 있도록 프로젝트의 전반적인 구조를 도식화한 문서입니다.

## 프로젝트 개요

**프로젝트명**: AOP (Spring Boot 기반 업무 시스템 + 대시보드)  
**프로젝트 타입**: Full-Stack Web Application  
**기술 스택**: 
- Backend: Spring Boot 3.2.0, Java 17, Spring Security, JWT, JPA/Hibernate
- Frontend: React 19, TypeScript, Vite, Chart.js, React Router
- Database: PostgreSQL (운영) / H2 (개발/테스트)

---

## 전체 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                         클라이언트 브라우저                        │
│                    (React + TypeScript + Vite)                   │
│                     http://localhost:5173                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS 요청 (CORS 허용)
                            │ Authorization: Bearer <JWT_TOKEN>
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Spring Boot Application                       │
│                        (포트: 8080)                              │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Spring Security Filter Chain                 │  │
│  │  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐ │  │
│  │  │  CORS    │→ │   JWT Auth   │→ │ UsernamePassword   │ │  │
│  │  │  Filter  │  │   Filter     │  │     Filter         │ │  │
│  │  └──────────┘  └──────────────┘  └────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            │                                     │
│                            ▼                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    API Controllers                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │   Auth       │  │   Admin      │  │  Dashboard   │  │  │
│  │  │ Controller   │  │ Controller   │  │ Controller   │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            │                                     │
│                            ▼                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Domain Services                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │  UserService │  │ JwtToken     │  │ CustomUser   │  │  │
│  │  │              │  │ Provider     │  │ Details      │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            │                                     │
│                            ▼                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    JPA Repositories                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │ UserRepository│ │ RoleRepository│ │ Dashboard    │  │  │
│  │  │              │  │              │  │ MetricRepo   │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ JPA/Hibernate
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                        │
│                      (포트: 5432)                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│  │   users    │  │   roles    │  │user_roles  │               │
│  └────────────┘  └────────────┘  └────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 백엔드 프로젝트 구조

```
src/main/java/com/example/app/
│
├── AppApplication.java                    # Spring Boot 메인 진입점
│
├── config/                                # 설정 클래스들
│   ├── SecurityConfig.java               # Spring Security 설정 (JWT, CORS, 인가 규칙)
│   ├── JpaConfig.java                    # JPA Auditing 설정 (생성일, 수정일 자동 관리)
│   ├── PasswordEncoderConfig.java        # BCrypt 비밀번호 암호화 설정
│   ├── JwtProperties.java                # JWT 설정값 관리 (secret, expiration)
│   ├── JwtAuthenticationEntryPoint.java  # 401 Unauthorized 처리
│   ├── JwtAccessDeniedHandler.java       # 403 Forbidden 처리
│   ├── FilterConfig.java                 # 필터 설정
│   ├── ContentCachingFilter.java         # 요청 본문 캐싱 필터
│   └── RequestBodyCachingFilter.java     # 요청 본문 캐싱 필터
│
├── domain/                               # 도메인 모델 (비즈니스 로직)
│   ├── common/
│   │   └── BaseEntity.java              # 공통 엔티티 (id, createdAt, updatedAt)
│   │
│   ├── user/                            # 사용자 도메인
│   │   ├── User.java                    # 사용자 엔티티 (JPA)
│   │   ├── Role.java                    # 역할 엔티티 (JPA)
│   │   ├── RoleType.java                # 역할 타입 enum (ROLE_ADMIN, ROLE_USER)
│   │   ├── UserService.java             # 사용자 비즈니스 로직
│   │   ├── UserRepository.java          # 사용자 데이터 접근 (JPA Repository)
│   │   ├── RoleRepository.java          # 역할 데이터 접근 (JPA Repository)
│   │   ├── DataInitializer.java         # 초기 데이터 생성 (관리자 계정, 역할 등)
│   │   ├── UserTest.java                # 테스트용 엔티티
│   │   └── exception/
│   │       ├── UserNotFoundException.java
│   │       └── DuplicateUsernameException.java
│   │
│   ├── auth/                            # 인증 도메인
│   │   ├── JwtTokenProvider.java        # JWT 토큰 생성/검증
│   │   ├── JwtAuthenticationFilter.java # JWT 인증 필터 (모든 요청에서 토큰 검증)
│   │   ├── CustomUserDetailsService.java # Spring Security UserDetailsService 구현
│   │   └── package-info.java
│   │
│   ├── dashboard/                       # 대시보드 도메인
│   │   └── DashboardMetricRepository.java # 대시보드 메트릭 데이터 접근
│   │
│   ├── menu/                            # 메뉴 도메인 (향후 확장)
│   └── setting/                         # 설정 도메인 (향후 확장)
│
├── api/                                 # REST API 컨트롤러
│   ├── auth/                           # 인증 API
│   │   ├── AuthController.java         # POST /api/auth/login, GET /api/auth/me
│   │   ├── dto/
│   │   │   ├── LoginRequest.java
│   │   │   ├── LoginResponse.java
│   │   │   └── UserInfoResponse.java
│   │   └── exception/
│   │       └── AuthExceptionHandler.java # 인증 예외 처리
│   │
│   ├── admin/                          # 관리자 API
│   │   ├── AdminController.java        # 관리자 대시보드 API
│   │   ├── AdminUserController.java    # 사용자 관리 API (CRUD)
│   │   ├── dto/
│   │   │   ├── UserSummaryResponse.java
│   │   │   ├── UserCreateRequest.java
│   │   │   ├── UserUpdateRequest.java
│   │   │   ├── UserStatusUpdateRequest.java
│   │   │   └── UserPasswordChangeRequest.java
│   │   └── exception/
│   │       └── AdminExceptionHandler.java # 관리자 API 예외 처리
│   │
│   ├── dashboard/                      # 대시보드 API
│   │   ├── DashboardController.java    # GET /api/dashboard/overview
│   │   └── dto/
│   │       ├── DashboardOverviewResponse.java
│   │       ├── SummaryCard.java
│   │       ├── ChartData.java
│   │       └── ChartDataset.java
│   │
│   └── profile/                        # 프로필 API
│       ├── ProfileController.java      # GET /api/profile, PUT /api/profile
│       ├── dto/
│       │   ├── ProfileResponse.java
│       │   ├── ProfileUpdateRequest.java
│       │   └── ProfilePasswordChangeRequest.java
│       └── exception/
│           ├── InvalidCurrentPasswordException.java
│           └── ProfileExceptionHandler.java
│
└── reporting/                          # 리포트 모듈 (향후 MyBatis 추가 예정)
    ├── dto/
    ├── mapper/
    └── service/
```

---

## 데이터베이스 스키마

```
┌─────────────────────────────────────────────────────────────┐
│                      users 테이블                            │
├─────────────────────────────────────────────────────────────┤
│ id (PK, BIGINT, Auto)                                       │
│ username (VARCHAR(50), UNIQUE, NOT NULL)                    │
│ password (VARCHAR(255), NOT NULL)  ← BCrypt 해시            │
│ email (VARCHAR(100), UNIQUE)                                │
│ name (VARCHAR(50))                                          │
│ active (BOOLEAN, NOT NULL, DEFAULT TRUE)                    │
│ created_at (TIMESTAMP)                                      │
│ updated_at (TIMESTAMP)                                      │
└─────────────────────────────────────────────────────────────┘
            │
            │ Many-to-Many 관계
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                    user_roles 테이블                         │
│                  (중간 테이블)                                │
├─────────────────────────────────────────────────────────────┤
│ user_id (FK → users.id)                                     │
│ role_id (FK → roles.id)                                     │
│ PRIMARY KEY (user_id, role_id)                              │
└─────────────────────────────────────────────────────────────┘
            │
            │ Many-to-Many 관계
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                      roles 테이블                            │
├─────────────────────────────────────────────────────────────┤
│ id (PK, BIGINT, Auto)                                       │
│ code (VARCHAR(50), UNIQUE, NOT NULL)  ← ROLE_ADMIN, ROLE_USER│
│ name (VARCHAR(100))                                         │
│ description (VARCHAR(255))                                  │
│ active (BOOLEAN, NOT NULL, DEFAULT TRUE)                    │
│ created_at (TIMESTAMP)                                      │
│ updated_at (TIMESTAMP)                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 인증/인가 플로우

```
┌──────────────┐
│   클라이언트   │
│  (React App) │
└──────┬───────┘
       │
       │ 1. POST /api/auth/login
       │    { username, password }
       ▼
┌─────────────────────────────────────────┐
│         AuthController.login()          │
│  - AuthenticationManager.authenticate() │
│  - CustomUserDetailsService.loadUser()  │
│  - PasswordEncoder.matches()            │
└──────┬──────────────────────────────────┘
       │
       │ 2. 인증 성공
       │
       ▼
┌─────────────────────────────────────────┐
│      JwtTokenProvider.generateToken()   │
│  - 사용자 정보를 JWT 토큰으로 변환        │
│  - secret key로 서명                    │
│  - expiration 시간 설정                 │
└──────┬──────────────────────────────────┘
       │
       │ 3. JWT 토큰 반환
       │    { accessToken, user: {...} }
       ▼
┌──────────────┐
│   클라이언트   │
│ 토큰을 저장   │
└──────┬───────┘
       │
       │ 4. 이후 모든 요청에 포함
       │    Authorization: Bearer <token>
       ▼
┌─────────────────────────────────────────┐
│    JwtAuthenticationFilter              │
│  - 요청 헤더에서 토큰 추출                │
│  - JwtTokenProvider.validateToken()     │
│  - 토큰에서 사용자 정보 추출              │
│  - SecurityContext에 인증 정보 설정      │
└──────┬──────────────────────────────────┘
       │
       │ 5. SecurityContext에 인증 정보 설정됨
       │
       ▼
┌─────────────────────────────────────────┐
│         SecurityConfig                  │
│  - authorizeHttpRequests()              │
│  - /api/admin/** → hasRole("ADMIN")     │
│  - /api/** → authenticated()            │
└──────┬──────────────────────────────────┘
       │
       │ 6. 권한 확인 통과
       │
       ▼
┌─────────────────────────────────────────┐
│      Controller Method                  │
│  @AuthenticationPrincipal UserDetails   │
└─────────────────────────────────────────┘
```

---

## API 엔드포인트 목록

### 인증 API (`/api/auth`)
| Method | Endpoint | 설명 | 인증 필요 | 권한 |
|--------|----------|------|----------|------|
| GET | `/api/auth/health` | 서버 상태 확인 | ❌ | - |
| POST | `/api/auth/login` | 로그인 (JWT 토큰 발급) | ❌ | - |
| GET | `/api/auth/me` | 현재 사용자 정보 조회 | ✅ | - |

### 관리자 API (`/api/admin`)
| Method | Endpoint | 설명 | 인증 필요 | 권한 |
|--------|----------|------|----------|------|
| GET | `/api/admin/users` | 사용자 목록 조회 | ✅ | ADMIN |
| GET | `/api/admin/users/{id}` | 사용자 상세 조회 | ✅ | ADMIN |
| POST | `/api/admin/users` | 사용자 생성 | ✅ | ADMIN |
| PUT | `/api/admin/users/{id}` | 사용자 정보 수정 | ✅ | ADMIN |
| PATCH | `/api/admin/users/{id}/status` | 사용자 활성화/비활성화 | ✅ | ADMIN |
| PATCH | `/api/admin/users/{id}/password` | 사용자 비밀번호 변경 | ✅ | ADMIN |
| DELETE | `/api/admin/users/{id}` | 사용자 삭제 | ✅ | ADMIN |

### 대시보드 API (`/api/dashboard`)
| Method | Endpoint | 설명 | 인증 필요 | 권한 |
|--------|----------|------|----------|------|
| GET | `/api/dashboard/overview` | 대시보드 개요 데이터 | ✅ | USER/ADMIN |

### 프로필 API (`/api/profile`)
| Method | Endpoint | 설명 | 인증 필요 | 권한 |
|--------|----------|------|----------|------|
| GET | `/api/profile` | 현재 사용자 프로필 조회 | ✅ | - |
| PUT | `/api/profile` | 프로필 정보 수정 | ✅ | - |
| PATCH | `/api/profile/password` | 비밀번호 변경 | ✅ | - |

---

## 프론트엔드 프로젝트 구조

```
frontend/
│
├── src/
│   ├── main.tsx                      # React 앱 진입점
│   │
│   ├── routes/
│   │   └── AppRouter.tsx             # React Router 설정
│   │
│   ├── auth/
│   │   ├── AuthContext.tsx           # 인증 상태 관리 (Context API)
│   │   └── RequireAuth.tsx           # 인증 필요한 페이지 보호
│   │
│   ├── api/                          # 백엔드 API 클라이언트
│   │   ├── client.ts                 # Axios 인스턴스 설정 (JWT 토큰 자동 추가)
│   │   ├── authApi.ts                # 인증 API 호출
│   │   ├── dashboardApi.ts           # 대시보드 API 호출
│   │   ├── adminUserApi.ts           # 관리자 사용자 API 호출
│   │   └── profileApi.ts             # 프로필 API 호출
│   │
│   ├── pages/                        # 페이지 컴포넌트
│   │   ├── LoginPage.tsx             # 로그인 페이지
│   │   ├── UserDashboardPage.tsx     # 일반 사용자 대시보드
│   │   ├── AdminUserListPage.tsx     # 관리자 사용자 목록
│   │   ├── ProfilePage.tsx           # 프로필 페이지
│   │   └── ReportsPage.tsx           # 리포트 페이지
│   │
│   ├── components/                   # 재사용 가능한 컴포넌트
│   │   ├── Header.tsx                # 상단 헤더
│   │   ├── ProfileDropdown.tsx       # 프로필 드롭다운 메뉴
│   │   ├── ErrorBoundary.tsx         # 에러 바운더리
│   │   ├── admin/
│   │   │   ├── AdminHeader.tsx
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── AdminUserTable.tsx
│   │   │   └── AdminUserCreateForm.tsx
│   │   ├── dashboard/
│   │   │   ├── DashboardCard.tsx
│   │   │   └── AiPromptModal.tsx
│   │   ├── layout/
│   │   │   └── Sidebar.tsx
│   │   └── report/
│   │       ├── ReportSheet.tsx
│   │       └── WorkshopKpiSheet.css
│   │
│   ├── layout/                       # 레이아웃 컴포넌트
│   │   ├── AppLayout.tsx             # 일반 사용자 레이아웃
│   │   └── AdminLayout.tsx           # 관리자 레이아웃
│   │
│   ├── types/                        # TypeScript 타입 정의
│   │   ├── index.ts
│   │   └── dashboard.ts
│   │
│   └── styles/                       # CSS 스타일
│       ├── dashboard.css
│       ├── header.css
│       ├── adminLayout.css
│       └── ...
│
├── package.json                      # npm 의존성
├── vite.config.ts                    # Vite 빌드 설정
└── tsconfig.json                     # TypeScript 설정
```

---

## 주요 설정 파일

### `application.yml`
- **프로파일**: `postgresql` (기본), `oracle` (향후)
- **데이터베이스**: PostgreSQL (운영) / H2 (개발)
- **JWT 설정**: secret key, expiration time
- **CORS 설정**: `http://localhost:5173` 허용

### `SecurityConfig.java`
- **인증 방식**: JWT (Stateless)
- **세션**: 비활성화 (STATELESS)
- **CSRF**: 비활성화 (JWT 기반이므로 불필요)
- **인가 규칙**:
  - `/api/auth/login`, `/api/auth/health`: 모든 사용자 허용
  - `/api/admin/**`: ADMIN 역할 필요
  - `/api/**`: 인증된 사용자만 접근 가능

---

## 주요 의존성 (build.gradle)

### Backend
- `spring-boot-starter-web`: Spring MVC
- `spring-boot-starter-security`: Spring Security
- `spring-boot-starter-data-jpa`: JPA/Hibernate
- `spring-boot-starter-validation`: 요청 데이터 검증
- `io.jsonwebtoken:jjwt-*`: JWT 토큰 생성/검증
- `org.postgresql:postgresql`: PostgreSQL 드라이버
- `com.h2database:h2`: H2 데이터베이스 (개발용)
- `org.projectlombok:lombok`: 보일러플레이트 코드 제거

### Frontend
- `react`, `react-dom`: React 프레임워크
- `react-router-dom`: 라우팅
- `axios`: HTTP 클라이언트
- `chart.js`, `react-chartjs-2`: 차트 라이브러리
- `typescript`: 타입 안정성
- `vite`: 빌드 도구

---

## 초기 데이터 (DataInitializer)

애플리케이션 시작 시 자동으로 생성되는 데이터:

1. **역할 (Roles)**
   - `ROLE_ADMIN`: 관리자 역할
   - `ROLE_USER`: 일반 사용자 역할

2. **사용자 (Users)**
   - 관리자 계정: `admin` / 비밀번호: `admin1234`
   - 테스트 사용자 100명: `user1` ~ `user100` / 비밀번호: `user1234`

---

## 보안 주요 사항

1. **비밀번호 암호화**: BCrypt 사용 (단방향 해시)
2. **JWT 토큰**: 
   - 서명 방식: HS256
   - 만료 시간: 1시간 (설정 가능)
   - 토큰 위치: HTTP Authorization 헤더
3. **CORS**: React 개발 서버(`http://localhost:5173`)만 허용
4. **인가**: 역할 기반 접근 제어 (RBAC)

---

## 데이터 흐름 예시: 로그인 → 대시보드 조회

```
1. 사용자가 로그인 페이지에서 username/password 입력
   ↓
2. POST /api/auth/login 요청
   ↓
3. AuthController.login() 호출
   - AuthenticationManager로 인증 시도
   - CustomUserDetailsService가 DB에서 사용자 조회
   - PasswordEncoder가 비밀번호 검증
   ↓
4. 인증 성공 시 JwtTokenProvider가 JWT 토큰 생성
   ↓
5. 클라이언트에 토큰 반환
   ↓
6. 클라이언트가 토큰을 localStorage에 저장
   ↓
7. 사용자가 대시보드 페이지 접근
   ↓
8. GET /api/dashboard/overview 요청 (Authorization 헤더에 토큰 포함)
   ↓
9. JwtAuthenticationFilter가 토큰 검증
   - JwtTokenProvider.validateToken() 호출
   - 토큰에서 사용자 정보 추출
   - SecurityContext에 인증 정보 설정
   ↓
10. SecurityConfig가 권한 확인 (authenticated() 통과)
    ↓
11. DashboardController.getOverview() 호출
    ↓
12. 더미 데이터 생성 및 반환
    ↓
13. 클라이언트가 차트 데이터 렌더링
```

---

## 향후 확장 계획

1. **리포트 모듈**: MyBatis 추가하여 복잡한 쿼리 처리
2. **AI/ML 통합**: 대시보드 예측 데이터 추가
3. **메뉴/권한 관리**: 동적 메뉴 시스템
4. **시스템 설정**: 관리자 설정 페이지
5. **Oracle 지원**: Oracle 프로파일 활성화

---

## 개발 환경 설정

### 백엔드 실행
```bash
./gradlew bootRun
# 또는
./gradlew bootRun --args='--spring.profiles.active=postgresql'
```

### 프론트엔드 실행
```bash
cd frontend
npm install
npm run dev
```

### 데이터베이스 연결
- **PostgreSQL**: `jdbc:postgresql://localhost:5432/aop_db`
- **H2 콘솔**: `http://localhost:8080/h2-console`

---

이 문서는 프로젝트의 전체 구조를 이해하는 데 도움이 되도록 작성되었습니다. 
특정 부분에 대해 더 자세한 정보가 필요하면 해당 파일의 주석을 참고하시기 바랍니다.








