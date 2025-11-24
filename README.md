# Spring Boot 업무 시스템 + 대시보드 프로젝트

Spring Boot 3.x 기반의 백엔드 프로젝트입니다.

## 기술 스택

- **Spring Boot 3.2.0**
- **Java 17**
- **Gradle**
- **Spring Web** - RESTful API 제공
- **Spring Security** - 인증/인가 (향후 JWT 추가 예정)
- **Spring Data JPA** - 데이터베이스 ORM
- **PostgreSQL / H2** - 데이터베이스 (H2는 개발용)

## 프로젝트 구조

```
com.example.app
 ├─ config          # 설정 클래스
 │   ├─ SecurityConfig    # Spring Security 설정 (JWT 추가 예정)
 │   ├─ CorsConfig        # CORS 설정 (React 프론트엔드용)
 │   └─ JpaConfig         # JPA Auditing 설정
 │
 ├─ domain          # 도메인 모델 (JPA 엔티티)
 │   ├─ common      # BaseEntity (공통 필드: id, createdAt, updatedAt)
 │   ├─ user        # User, Role 엔티티 및 서비스
 │   ├─ auth        # 인증 관련 도메인 (향후 추가 예정)
 │   ├─ menu        # 메뉴/권한 관련 도메인 (향후 추가 예정)
 │   └─ setting     # 시스템 설정 도메인 (향후 추가 예정)
 │
 ├─ reporting       # 리포트/대시보드 모듈 (향후 MyBatis/Native Query 추가 예정)
 │   ├─ dto         # 데이터 전송 객체
 │   ├─ mapper      # MyBatis Mapper (향후 추가)
 │   └─ service     # 리포트 서비스 (향후 추가)
 │
 └─ api            # REST API 컨트롤러
     ├─ auth       # 인증 API (/api/auth/*)
     ├─ admin      # 관리자 API (/api/admin/*)
     └─ dashboard  # 대시보드 API (/api/dashboard/*)
```

## 시작하기

### 1. 프로젝트 빌드

```bash
./gradlew build
```

### 2. 애플리케이션 실행

```bash
./gradlew bootRun
```

또는 IDE에서 `AppApplication.java`를 실행하세요.

### 3. 서버 확인

서버가 시작되면 다음 주소에서 확인할 수 있습니다:

- **애플리케이션**: http://localhost:8080
- **H2 콘솔**: http://localhost:8080/h2-console
  - JDBC URL: `jdbc:h2:mem:testdb`
  - Username: `sa`
  - Password: (비워두기)

### 4. API 테스트

#### Health Check
```bash
curl http://localhost:8080/api/auth/health
```

응답:
```json
{
  "status": "OK"
}
```

#### 대시보드 샘플 데이터
```bash
curl http://localhost:8080/api/dashboard/sample
```

## 데이터베이스 설정

### H2 (기본값, 개발용)

`application.yml`에서 이미 설정되어 있습니다. 별도 설치 없이 사용 가능합니다.

### PostgreSQL (운영 환경)

1. PostgreSQL 설치 및 데이터베이스 생성
2. `application.yml`에서 다음 설정을 주석 해제하고 수정:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/appdb
    username: postgres
    password: postgres
    driver-class-name: org.postgresql.Driver
  jpa:
    database-platform: org.hibernate.dialect.PostgreSQLDialect
```

## 주요 기능

### 현재 구현됨

- ✅ 기본 프로젝트 구조
- ✅ Spring Security 설정 (CORS 포함)
- ✅ User, Role 엔티티 및 기본 CRUD
- ✅ Health Check API
- ✅ 대시보드 샘플 API

### 향후 추가 예정

- 🔲 JWT 기반 인증/인가
- 🔲 로그인/로그아웃 API
- 🔲 사용자 관리 API
- 🔲 MyBatis 또는 Native Query를 사용한 리포트 모듈
- 🔲 메뉴/권한 관리
- 🔲 시스템 설정 관리

## 개발 가이드

### 레이어드 아키텍처

이 프로젝트는 레이어드 아키텍처를 따릅니다:

1. **API Layer (Controller)**: HTTP 요청/응답 처리
2. **Service Layer**: 비즈니스 로직 처리
3. **Repository Layer**: 데이터베이스 접근
4. **Domain Layer (Entity)**: 도메인 모델

### 코드 스타일

- 모든 클래스와 주요 메서드에 한국어 주석 포함
- 초보자가 이해하기 쉽도록 상세한 설명 제공
- 향후 확장 가능한 구조로 설계

## 라이선스

이 프로젝트는 학습 목적으로 제작되었습니다.
