# 데이터베이스 설정

이 문서는 AOP 프로젝트의 데이터베이스 설정 방법을 상세히 설명합니다.

## 지원 데이터베이스

- **PostgreSQL** (운영 환경 권장)
- **H2** (개발/테스트용)
- **Oracle** (향후 지원 예정)

## PostgreSQL 설정

### 1. PostgreSQL 설치

#### Windows
1. PostgreSQL 공식 사이트에서 설치 프로그램 다운로드
2. 설치 시 포트 5432 사용 (기본값)
3. postgres 사용자 비밀번호 설정

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

#### macOS
```bash
brew install postgresql
brew services start postgresql
```

### 2. 데이터베이스 및 사용자 생성

PostgreSQL에 접속하여 데이터베이스와 사용자를 생성합니다:

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

### 3. 애플리케이션 설정

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

### 4. 애플리케이션 실행

```bash
# 방법 1: 명령줄에서 프로파일 지정
./gradlew bootRun --args='--spring.profiles.active=postgresql'

# 방법 2: 환경변수 설정
export SPRING_PROFILES_ACTIVE=postgresql
./gradlew bootRun

# 방법 3: IDE에서 실행 시 VM 옵션에 추가
-Dspring.profiles.active=postgresql
```

### 5. 연결 확인

애플리케이션 실행 시 로그에서 다음 메시지를 확인하세요:

```
HikariPool-1 - Starting...
HikariPool-1 - Start completed.
```

또는 PostgreSQL에 직접 접속하여 테이블이 생성되었는지 확인:

```sql
psql -U aop -d aop_db
\dt  -- 테이블 목록 확인
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

## DB 연결 실패 시 확인 순서

PostgreSQL 연결이 실패하는 경우 다음 순서로 확인하세요:

### 1단계: PostgreSQL 서비스 실행 확인

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

### 2단계: 포트 확인 (5432)

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

### 3단계: 데이터베이스 존재 확인

```bash
psql -U postgres -l
```

또는:

```sql
psql -U postgres
\l
```

**문제**: `aop_db` 데이터베이스가 없음  
**해결**: 위의 "데이터베이스 및 사용자 생성" 섹션을 참고하여 데이터베이스를 생성하세요.

### 4단계: 사용자 및 권한 확인

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

### 5단계: 인증 설정 확인 (pg_hba.conf)

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

### 6단계: 방화벽 확인

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

### 7단계: application.yml 설정 확인

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

### 8단계: JDBC 드라이버 확인

`build.gradle`에 PostgreSQL 드라이버가 포함되어 있는지 확인:

```gradle
dependencies {
    runtimeOnly 'org.postgresql:postgresql'
}
```

**문제**: 드라이버가 없음  
**해결**: 이미 포함되어 있지만, 없다면 추가하고 프로젝트를 다시 빌드하세요.

### 9단계: 로그 확인

애플리케이션 실행 시 상세한 로그를 확인하세요:

```yaml
logging:
  level:
    org.springframework.jdbc.datasource: DEBUG
    com.zaxxer.hikari: DEBUG
    org.postgresql: INFO
```

로그에서 정확한 에러 메시지를 확인하면 문제를 더 쉽게 파악할 수 있습니다.

## 일반적인 에러 메시지와 해결 방법

| 에러 메시지 | 원인 | 해결 방법 |
|------------|------|----------|
| `Connection refused` | PostgreSQL 서비스가 실행되지 않음 | PostgreSQL 서비스 시작 |
| `FATAL: password authentication failed` | 비밀번호가 잘못됨 | application.yml의 비밀번호 확인 |
| `FATAL: database "aop_db" does not exist` | 데이터베이스가 없음 | 데이터베이스 생성 |
| `FATAL: role "aop" does not exist` | 사용자가 없음 | 사용자 생성 |
| `Connection to localhost:5432 refused` | 포트가 열려있지 않음 | PostgreSQL 서비스 및 포트 확인 |
| `permission denied for schema public` | 권한이 없음 | 사용자에게 권한 부여 |

## 관련 문서

- [데이터베이스](../02-backend/database.md) - 데이터베이스 스키마 및 설정
- [데이터 아키텍처](../01-architecture/data-architecture.md) - 3계층 데이터 웨어하우스 구조
- [외부 접속 설정](external-access.md) - 외부 네트워크 접속 가이드

