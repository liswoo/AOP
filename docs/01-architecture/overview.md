# 전체 시스템 아키텍처

이 문서는 AOP 프로젝트의 전체 시스템 아키텍처를 설명합니다.

## 프로젝트 개요

**프로젝트명**: AOP (Spring Boot 기반 업무 시스템 + 대시보드)  
**프로젝트 타입**: Full-Stack Web Application  
**기술 스택**: 
- Backend: Spring Boot 3.2.0, Java 17, Spring Security, JWT, JPA/Hibernate
- Frontend: React 19, TypeScript, Vite, Chart.js, React Router
- Database: PostgreSQL (운영) / H2 (개발/테스트)

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
│                    Spring Boot Application                      │
│                        (포트: 8080)                              │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Spring Security Filter Chain                 │  │
│  │  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐ │ │
│  │  │  CORS    │→ │   JWT Auth   │→ │ UsernamePassword   │ │ │
│  │  │  Filter  │  │   Filter     │  │     Filter         │ │ │
│  │  └──────────┘  └──────────────┘  └────────────────────┘ │ │
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
│                      (포트: 5432)                                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                 │
│  │   users    │  │   roles    │  │user_roles  │                 │
│  └────────────┘  └────────────┘  └────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

## 레이어드 아키텍처

이 프로젝트는 레이어드 아키텍처를 따릅니다:

1. **API Layer (Controller)**: HTTP 요청/응답 처리
2. **Service Layer**: 비즈니스 로직 처리
3. **Repository Layer**: 데이터베이스 접근
4. **Domain Layer (Entity)**: 도메인 모델

## 데이터 아키텍처

이 프로젝트는 **3계층 데이터 웨어하우스 아키텍처**를 사용합니다:

```
원천 데이터 (Source Systems)
  ↓
DW 레이어 (Data Warehouse)
  - DimDate (날짜 차원)
  - FactSales (매출 팩트)
  - FactInventory (재고 팩트)
  - FactDowntime (비가동 팩트)
  ↓ ETL
Mart 레이어 (Mart Tables)
  - MartDailySales, MartWeeklySales, MartMonthlySales
  - MartDailyInventory
  - MartDailyDowntime
  ↓ ETL
Dashboard 레이어
  - DashboardMetric
  ↓
대시보드 API → 프론트엔드
```

자세한 내용은 [데이터 아키텍처 문서](data-architecture.md)를 참고하세요.

## 인증/인가 플로우

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
12. 데이터 조회 및 반환
    ↓
13. 클라이언트가 차트 데이터 렌더링
```

자세한 내용은 [인증/인가 문서](../02-backend/authentication.md)를 참고하세요.

## 주요 설정

### SecurityConfig
- **인증 방식**: JWT (Stateless)
- **세션**: 비활성화 (STATELESS)
- **CSRF**: 비활성화 (JWT 기반이므로 불필요)
- **인가 규칙**:
  - `/api/auth/login`, `/api/auth/health`: 모든 사용자 허용
  - `/api/admin/**`: ADMIN 역할 필요
  - `/api/**`: 인증된 사용자만 접근 가능

### application.yml
- **프로파일**: `postgresql` (기본), `oracle` (향후)
- **데이터베이스**: PostgreSQL (운영) / H2 (개발)
- **JWT 설정**: secret key, expiration time
- **CORS 설정**: `http://localhost:5173` 허용

## 초기 데이터

애플리케이션 시작 시 자동으로 생성되는 데이터:

1. **역할 (Roles)**
   - `ROLE_ADMIN`: 관리자 역할
   - `ROLE_USER`: 일반 사용자 역할

2. **사용자 (Users)**
   - 관리자 계정: `admin` / 비밀번호: `admin1234`
   - 일반 사용자: `user` / 비밀번호: `1234`
   - 테스트 사용자 100명: `user1` ~ `user100` / 비밀번호: `user1234`

3. **DW 초기 데이터**
   - 최근 30일간의 샘플 데이터 생성
   - DimDate, FactSales, FactInventory, FactDowntime

4. **ETL 프로세스 실행**
   - DW → Mart → Dashboard 순서로 데이터 이동

## 보안 주요 사항

1. **비밀번호 암호화**: BCrypt 사용 (단방향 해시)
2. **JWT 토큰**: 
   - 서명 방식: HS256
   - 만료 시간: 1시간 (설정 가능)
   - 토큰 위치: HTTP Authorization 헤더
3. **CORS**: React 개발 서버(`http://localhost:5173`)만 허용
4. **인가**: 역할 기반 접근 제어 (RBAC)

## 관련 문서

- [데이터 아키텍처](data-architecture.md) - 3계층 데이터 웨어하우스 상세 설명
- [백엔드 개요](../02-backend/overview.md) - 백엔드 프로젝트 구조
- [프론트엔드 개요](../03-frontend/overview.md) - 프론트엔드 프로젝트 구조
- [인증/인가](../02-backend/authentication.md) - JWT 인증 시스템 상세

