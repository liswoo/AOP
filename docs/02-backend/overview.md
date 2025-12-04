# 백엔드 개요

이 문서는 AOP 프로젝트의 백엔드 구조와 기술 스택을 설명합니다.

## 기술 스택

- **Spring Boot 3.2.0** - 애플리케이션 프레임워크
- **Java 17** - 프로그래밍 언어
- **Gradle** - 빌드 도구
- **Spring Web** - RESTful API 제공
- **Spring Security** - 인증/인가 (JWT 기반)
- **Spring Data JPA** - 데이터베이스 ORM
- **JWT (jjwt)** - JSON Web Token 인증
- **PostgreSQL / H2** - 데이터베이스 (H2는 개발용)
- **Lombok** - 보일러플레이트 코드 제거

## 프로젝트 구조

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
│   ├── dw/                              # Data Warehouse 레이어
│   │   ├── DimDate.java                 # 날짜 차원 테이블
│   │   ├── FactSales.java               # 매출 팩트 테이블
│   │   ├── FactInventory.java           # 재고 팩트 테이블
│   │   ├── FactDowntime.java            # 비가동 팩트 테이블
│   │   └── 각 Repository 인터페이스
│   │
│   ├── mart/                            # Mart 레이어 (집계 데이터)
│   │   ├── MartDailySales.java          # 일별 매출 마트
│   │   ├── MartWeeklySales.java         # 주별 매출 마트
│   │   ├── MartMonthlySales.java        # 월별 매출 마트
│   │   ├── MartDailyInventory.java      # 일별 재고 마트
│   │   ├── MartDailyDowntime.java       # 일별 비가동 마트
│   │   └── 각 Repository 인터페이스
│   │
│   ├── dashboard/                       # 대시보드 도메인
│   │   ├── DashboardMetric.java         # 대시보드 메트릭 엔티티
│   │   └── DashboardMetricRepository.java # 대시보드 메트릭 데이터 접근
│   │
│   ├── etl/                             # ETL 서비스
│   │   └── EtlService.java              # DW → Mart → Dashboard ETL 프로세스
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
│   │   ├── dto/
│   │   │   ├── DashboardOverviewResponse.java
│   │   │   ├── SummaryCard.java
│   │   │   ├── ChartData.java
│   │   │   └── ChartDataset.java
│   │   └── service/
│   │       └── DashboardService.java    # 대시보드 비즈니스 로직
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

## 레이어드 아키텍처

이 프로젝트는 레이어드 아키텍처를 따릅니다:

1. **API Layer (Controller)**: HTTP 요청/응답 처리
2. **Service Layer**: 비즈니스 로직 처리
3. **Repository Layer**: 데이터베이스 접근
4. **Domain Layer (Entity)**: 도메인 모델

## 주요 설정 파일

### application.yml
- **프로파일**: `postgresql` (기본), `oracle` (향후)
- **데이터베이스**: PostgreSQL (운영) / H2 (개발)
- **JWT 설정**: secret key, expiration time
- **CORS 설정**: `http://localhost:5173` 허용

### SecurityConfig.java
- **인증 방식**: JWT (Stateless)
- **세션**: 비활성화 (STATELESS)
- **CSRF**: 비활성화 (JWT 기반이므로 불필요)
- **인가 규칙**:
  - `/api/auth/login`, `/api/auth/health`: 모든 사용자 허용
  - `/api/admin/**`: ADMIN 역할 필요
  - `/api/**`: 인증된 사용자만 접근 가능

## 주요 의존성 (build.gradle)

```gradle
dependencies {
    // Spring Boot 기본 웹 기능
    implementation 'org.springframework.boot:spring-boot-starter-web'
    
    // Validation (요청 데이터 검증)
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    
    // Spring Security (인증/인가)
    implementation 'org.springframework.boot:spring-boot-starter-security'
    
    // Spring Data JPA (데이터베이스 ORM)
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    
    // PostgreSQL 드라이버
    runtimeOnly 'org.postgresql:postgresql'
    
    // H2 데이터베이스 (개발/테스트용)
    runtimeOnly 'com.h2database:h2'
    
    // Lombok (보일러플레이트 코드 자동 생성)
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
    
    // JWT 라이브러리 (JSON Web Token)
    implementation 'io.jsonwebtoken:jjwt-api:0.12.3'
    runtimeOnly 'io.jsonwebtoken:jjwt-impl:0.12.3'
    runtimeOnly 'io.jsonwebtoken:jjwt-jackson:0.12.3'
    
    // 개발 도구
    developmentOnly 'org.springframework.boot:spring-boot-devtools'
    
    // 테스트
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.springframework.security:spring-security-test'
}
```

## 관련 문서

- [인증/인가](authentication.md) - JWT 기반 인증 시스템 상세
- [API 엔드포인트](api.md) - REST API 명세서
- [데이터베이스](database.md) - 데이터베이스 설정 및 스키마
- [전체 시스템 아키텍처](../01-architecture/overview.md) - 시스템 전체 구조



