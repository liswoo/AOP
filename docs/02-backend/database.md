# 데이터베이스 설정

이 문서는 AOP 프로젝트의 데이터베이스 설정 및 스키마를 설명합니다.

## 지원 데이터베이스

- **PostgreSQL** (운영 환경 권장)
- **H2** (개발/테스트용)
- **Oracle** (향후 지원 예정)

## 프로파일 기반 설정

이 프로젝트는 Spring Profile을 사용하여 데이터베이스를 쉽게 전환할 수 있습니다.

- **postgresql**: PostgreSQL 사용 (기본값)
- **oracle**: Oracle 사용 (추후 사용 가능)
- **기본값**: H2 인메모리 데이터베이스 (개발/테스트용)

## PostgreSQL 설정

### 1. PostgreSQL 설치 및 데이터베이스 생성

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

### 2. 애플리케이션 설정

**파일**: `src/main/resources/application.yml`

```yaml
spring:
  profiles:
    active: postgresql
  
  datasource:
    url: jdbc:postgresql://localhost:5432/aop_db
    username: aop
    password: 1234
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
  
  jpa:
    hibernate:
      ddl-auto: create  # 시작 시 스키마 생성
    show-sql: true
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.PostgreSQLDialect
```

### 3. 애플리케이션 실행

```bash
# 방법 1: 명령줄에서 프로파일 지정
./gradlew bootRun --args='--spring.profiles.active=postgresql'

# 방법 2: 환경변수 설정
export SPRING_PROFILES_ACTIVE=postgresql
./gradlew bootRun

# 방법 3: IDE에서 실행 시 VM 옵션에 추가
-Dspring.profiles.active=postgresql
```

### 4. 연결 확인

애플리케이션 실행 시 로그에서 다음 메시지를 확인하세요:

```
HikariPool-1 - Starting...
HikariPool-1 - Start completed.
```

## H2 설정 (개발/테스트)

H2는 별도 설정 없이 바로 사용 가능합니다.

### H2 콘솔 접속

- **URL**: http://localhost:8080/h2-console
- **JDBC URL**: `jdbc:h2:mem:testdb`
- **Username**: `sa`
- **Password**: (비워두기)

### application.yml 설정

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
    username: sa
    password: 
  
  h2:
    console:
      enabled: true
      path: /h2-console
  
  jpa:
    hibernate:
      ddl-auto: create
    show-sql: true
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.H2Dialect
```

## 데이터베이스 스키마

### 사용자 관련 테이블

#### users 테이블
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,  -- BCrypt 해시
    email VARCHAR(100) UNIQUE,
    name VARCHAR(50),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### roles 테이블
```sql
CREATE TABLE roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,  -- ROLE_ADMIN, ROLE_USER
    name VARCHAR(100),
    description VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### user_roles 테이블 (중간 테이블)
```sql
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);
```

### 데이터 웨어하우스 테이블

자세한 내용은 [데이터 아키텍처 문서](../01-architecture/data-architecture.md)를 참고하세요.

#### DW 레이어
- `dim_date` - 날짜 차원 테이블
- `fact_sales` - 매출 팩트 테이블
- `fact_inventory` - 재고 팩트 테이블
- `fact_downtime` - 비가동 팩트 테이블

#### Mart 레이어
- `mart_daily_sales` - 일별 매출 마트
- `mart_weekly_sales` - 주별 매출 마트
- `mart_monthly_sales` - 월별 매출 마트
- `mart_daily_inventory` - 일별 재고 마트
- `mart_daily_downtime` - 일별 비가동 마트

#### Dashboard 레이어
- `dashboard_metrics` - 대시보드 메트릭

## JPA 설정

### BaseEntity

모든 엔티티는 `BaseEntity`를 상속받아 공통 필드를 가집니다:

```java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
}
```

### JPA Auditing 설정

**파일**: `src/main/java/com/example/app/config/JpaConfig.java`

```java
@Configuration
@EnableJpaAuditing
public class JpaConfig {
}
```

## 초기 데이터

애플리케이션 시작 시 `DataInitializer`가 다음 데이터를 자동 생성합니다:

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

## DB 연결 실패 시 확인 순서

PostgreSQL 연결이 실패하는 경우 다음 순서로 확인하세요:

### 1단계: PostgreSQL 서비스 실행 확인

```bash
# Windows
net start postgresql-x64-18  # 버전에 따라 다를 수 있음

# Linux/Mac
sudo systemctl status postgresql
```

### 2단계: 포트 확인 (5432)

```bash
# Windows
netstat -an | findstr 5432

# Linux/Mac
lsof -i :5432
```

### 3단계: 데이터베이스 존재 확인

```bash
psql -U postgres -l
```

### 4단계: 사용자 및 권한 확인

```sql
psql -U postgres
\du  -- 사용자 목록 확인
```

### 5단계: application.yml 설정 확인

`src/main/resources/application.yml` 파일에서 다음 설정이 올바른지 확인:

```yaml
spring:
  profiles:
    active: postgresql
  
  datasource:
    url: jdbc:postgresql://localhost:5432/aop_db
    username: aop
    password: 1234
```

## 일반적인 에러 메시지와 해결 방법

| 에러 메시지 | 원인 | 해결 방법 |
|------------|------|----------|
| `Connection refused` | PostgreSQL 서비스가 실행되지 않음 | PostgreSQL 서비스 시작 |
| `FATAL: password authentication failed` | 비밀번호가 잘못됨 | application.yml의 비밀번호 확인 |
| `FATAL: database "aop_db" does not exist` | 데이터베이스가 없음 | 데이터베이스 생성 |
| `FATAL: role "aop" does not exist` | 사용자가 없음 | 사용자 생성 |
| `permission denied for schema public` | 권한이 없음 | 사용자에게 권한 부여 |

## 관련 문서

- [데이터 아키텍처](../01-architecture/data-architecture.md) - 3계층 데이터 웨어하우스 구조
- [백엔드 개요](overview.md) - 백엔드 프로젝트 구조
- [데이터베이스 설정 가이드](../04-deployment/database-setup.md) - 상세 설정 가이드

