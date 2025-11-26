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

### 프로파일 기반 설정

이 프로젝트는 Spring Profile을 사용하여 데이터베이스를 쉽게 전환할 수 있습니다.

- **postgresql**: PostgreSQL 사용 (기본값)
- **oracle**: Oracle 사용 (추후 사용 가능)
- **기본값**: H2 인메모리 데이터베이스 (개발/테스트용)

### PostgreSQL 사용하기

#### 1. PostgreSQL 설치 및 데이터베이스 생성

PostgreSQL이 설치되어 있어야 합니다. 다음 명령어로 데이터베이스와 사용자를 생성하세요:

```sql
-- PostgreSQL에 접속 (postgres 사용자로)
psql -U postgres

-- 데이터베이스 생성
CREATE DATABASE aop_db;

-- 사용자 생성 및 권한 부여
CREATE USER aop WITH PASSWORD '1234';
GRANT ALL PRIVILEGES ON DATABASE aop_db TO aop;

-- 데이터베이스에 접속하여 스키마 권한 부여
\c aop_db
GRANT ALL ON SCHEMA public TO aop;
```

#### 2. 애플리케이션 실행

PostgreSQL 프로파일을 활성화하여 실행:

```bash
# 방법 1: 명령줄에서 프로파일 지정
./gradlew bootRun --args='--spring.profiles.active=postgresql'

# 방법 2: 환경변수 설정
export SPRING_PROFILES_ACTIVE=postgresql
./gradlew bootRun

# 방법 3: IDE에서 실행 시 VM 옵션에 추가
-Dspring.profiles.active=postgresql
```

#### 3. 연결 확인

애플리케이션 실행 시 로그에서 다음 메시지를 확인하세요:

```
HikariPool-1 - Starting...
HikariPool-1 - Start completed.
```

또는 다음과 같은 에러가 없어야 합니다:

```
Connection to localhost:5432 refused
```

#### 4. 테이블 자동 생성 확인

애플리케이션이 정상적으로 시작되면 다음 테이블들이 자동으로 생성됩니다:

- `users` - 사용자 테이블
- `roles` - 역할 테이블
- `user_roles` - 사용자-역할 매핑 테이블
- `user_test` - 테스트용 테이블

PostgreSQL에 접속하여 확인:

```sql
psql -U aop -d aop_db

-- 테이블 목록 확인
\dt

-- user_test 테이블 구조 확인
\d user_test
```

### Oracle 사용하기 (추후)

Oracle로 전환하려면:

1. `build.gradle`에 Oracle JDBC 드라이버 추가
2. 프로파일을 `oracle`로 변경하여 실행:

```bash
./gradlew bootRun --args='--spring.profiles.active=oracle'
```

### DB 연결 실패 시 확인 순서

PostgreSQL 연결이 실패하는 경우 다음 순서로 확인하세요:

#### 1단계: PostgreSQL 서비스 실행 확인

```bash
# Windows
net start postgresql-x64-18  # 버전에 따라 다를 수 있음
# 또는 서비스 관리자에서 확인

# Linux/Mac
sudo systemctl status postgresql
# 또는
sudo service postgresql status
```

**문제**: PostgreSQL 서비스가 실행되지 않음  
**해결**: PostgreSQL 서비스를 시작하세요.

#### 2단계: 포트 확인 (5432)

```bash
# Windows
netstat -an | findstr 5432

# Linux/Mac
netstat -an | grep 5432
# 또는
lsof -i :5432
```

**문제**: 포트 5432가 열려있지 않음  
**해결**: PostgreSQL이 다른 포트에서 실행 중이거나 서비스가 중지된 상태입니다.

#### 3단계: 데이터베이스 존재 확인

```bash
psql -U postgres -l
```

또는:

```sql
psql -U postgres
\l
```

**문제**: `aop_db` 데이터베이스가 없음  
**해결**: 위의 "PostgreSQL 사용하기" 섹션의 1단계를 참고하여 데이터베이스를 생성하세요.

#### 4단계: 사용자 및 권한 확인

```sql
psql -U postgres
\du  -- 사용자 목록 확인
```

**문제**: `aop` 사용자가 없거나 권한이 없음  
**해결**: 사용자를 생성하고 권한을 부여하세요:

```sql
CREATE USER aop WITH PASSWORD '1234';
GRANT ALL PRIVILEGES ON DATABASE aop_db TO aop;
\c aop_db
GRANT ALL ON SCHEMA public TO aop;
```

#### 5단계: 인증 설정 확인 (pg_hba.conf)

PostgreSQL의 `pg_hba.conf` 파일에서 로컬 연결이 허용되어 있는지 확인:

```bash
# Windows: PostgreSQL 설치 경로\data\pg_hba.conf
# Linux: /etc/postgresql/[version]/main/pg_hba.conf
# Mac: /usr/local/var/postgres/pg_hba.conf
```

다음과 같은 설정이 있어야 합니다:

```
# IPv4 local connections:
host    all             all             127.0.0.1/32            scram-sha-256
# 또는
host    all             all             127.0.0.1/32            md5
```

**문제**: 인증 방식이 잘못 설정됨  
**해결**: 위와 같이 설정하고 PostgreSQL을 재시작하세요.

#### 6단계: 방화벽 확인

```bash
# Windows 방화벽 확인
netsh advfirewall firewall show rule name=all | findstr 5432

# Linux/Mac
sudo ufw status
# 또는
sudo iptables -L
```

**문제**: 방화벽이 포트 5432를 차단함  
**해결**: 방화벽에서 포트 5432를 허용하세요.

#### 7단계: application.yml 설정 확인

`src/main/resources/application.yml` 파일에서 다음 설정이 올바른지 확인:

```yaml
spring:
  profiles:
    active: postgresql  # 프로파일이 postgresql로 설정되어 있는지 확인
  
  datasource:
    url: jdbc:postgresql://localhost:5432/aop_db  # 데이터베이스 이름 확인
    username: aop  # 사용자 이름 확인
    password: 1234  # 비밀번호 확인
```

**문제**: 설정값이 잘못됨  
**해결**: 실제 PostgreSQL 설정과 일치하도록 수정하세요.

#### 8단계: JDBC 드라이버 확인

`build.gradle`에 PostgreSQL 드라이버가 포함되어 있는지 확인:

```gradle
dependencies {
    runtimeOnly 'org.postgresql:postgresql'
}
```

**문제**: 드라이버가 없음  
**해결**: 이미 포함되어 있지만, 없다면 추가하고 프로젝트를 다시 빌드하세요.

#### 9단계: 로그 확인

애플리케이션 실행 시 상세한 로그를 확인하세요:

```yaml
logging:
  level:
    org.springframework.jdbc.datasource: DEBUG
    com.zaxxer.hikari: DEBUG
    org.postgresql: INFO
```

로그에서 정확한 에러 메시지를 확인하면 문제를 더 쉽게 파악할 수 있습니다.

#### 일반적인 에러 메시지와 해결 방법

| 에러 메시지 | 원인 | 해결 방법 |
|------------|------|----------|
| `Connection refused` | PostgreSQL 서비스가 실행되지 않음 | PostgreSQL 서비스 시작 |
| `FATAL: password authentication failed` | 비밀번호가 잘못됨 | application.yml의 비밀번호 확인 |
| `FATAL: database "aop_db" does not exist` | 데이터베이스가 없음 | 데이터베이스 생성 |
| `FATAL: role "aop" does not exist` | 사용자가 없음 | 사용자 생성 |
| `Connection to localhost:5432 refused` | 포트가 열려있지 않음 | PostgreSQL 서비스 및 포트 확인 |
| `permission denied for schema public` | 권한이 없음 | 사용자에게 권한 부여 |

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
