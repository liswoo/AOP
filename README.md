# AOP - Spring Boot 업무 시스템 + 대시보드 프로젝트

Spring Boot 3.x 기반의 풀스택 웹 애플리케이션입니다. 백엔드(Spring Boot)와 프론트엔드(React)로 구성되어 있으며, 3계층 데이터 웨어하우스 아키텍처를 사용합니다.

## 📚 문서 인덱스

이 프로젝트의 상세 문서는 `docs/` 폴더에 정리되어 있습니다.

### 🏗️ 아키텍처
- [전체 시스템 아키텍처](docs/01-architecture/overview.md) - 시스템 전체 구조 및 데이터 흐름
- [데이터 아키텍처](docs/01-architecture/data-architecture.md) - 3계층 데이터 웨어하우스 구조

### 🔧 백엔드
- [백엔드 개요](docs/02-backend/overview.md) - 백엔드 프로젝트 구조 및 기술 스택
- [인증/인가](docs/02-backend/authentication.md) - JWT 기반 인증 시스템
- [API 엔드포인트](docs/02-backend/api.md) - REST API 명세서
- [데이터베이스](docs/02-backend/database.md) - 데이터베이스 설정 및 스키마

### 🎨 프론트엔드
- [프론트엔드 개요](docs/03-frontend/overview.md) - 프론트엔드 프로젝트 구조 및 기술 스택
- [레이아웃 및 반응형](docs/03-frontend/layout.md) - 모바일/데스크톱 레이아웃 가이드
- [컴포넌트](docs/03-frontend/components.md) - 주요 컴포넌트 설명

### 🚀 배포 및 설정
- [외부 접속 설정](docs/04-deployment/external-access.md) - 외부 네트워크 접속 가이드
- [데이터베이스 설정](docs/04-deployment/database-setup.md) - PostgreSQL/H2 데이터베이스 설정

### 📋 기타
- [이슈 해결 로그](docs/ISSUES.md) - 주요 이슈 및 해결 방법 기록

---

## 🚀 빠른 시작

### 사전 요구사항
- Java 17 이상
- Node.js 18 이상
- PostgreSQL (선택사항, H2 사용 가능)
- Gradle (또는 Gradle Wrapper)

### 1. 프로젝트 클론 및 빌드

```bash
# 프로젝트 클론
git clone <repository-url>
cd AOP

# 백엔드 빌드
./gradlew build

# 프론트엔드 의존성 설치
cd frontend
npm install
cd ..
```

### 2. 데이터베이스 설정

#### PostgreSQL 사용 (권장)
1. PostgreSQL 설치 및 데이터베이스 생성
2. `src/main/resources/application.yml`에서 프로파일을 `postgresql`로 설정
3. 데이터베이스 연결 정보 설정

자세한 내용은 [데이터베이스 설정 가이드](docs/04-deployment/database-setup.md)를 참고하세요.

#### H2 사용 (개발/테스트)
- 별도 설정 없이 바로 사용 가능
- H2 콘솔: http://localhost:8080/h2-console

### 3. 애플리케이션 실행

#### 백엔드 실행
```bash
./gradlew bootRun
```

또는 PostgreSQL 프로파일 사용:
```bash
./gradlew bootRun --args='--spring.profiles.active=postgresql'
```

#### 프론트엔드 실행
```bash
cd frontend
npm run dev
```

### 4. 접속

- **프론트엔드**: http://localhost:5173
- **백엔드 API**: http://localhost:8080
- **H2 콘솔**: http://localhost:8080/h2-console

### 5. 초기 계정

애플리케이션 시작 시 자동으로 생성되는 계정:

- **관리자**: `admin` / `admin1234`
- **일반 사용자**: `user` / `1234`
- **테스트 사용자**: `user1` ~ `user100` / `user1234`

---

## 📋 기술 스택

### Backend
- **Spring Boot 3.2.0** - 애플리케이션 프레임워크
- **Java 17** - 프로그래밍 언어
- **Gradle** - 빌드 도구
- **Spring Web** - RESTful API 제공
- **Spring Security** - 인증/인가 (JWT 기반)
- **Spring Data JPA** - 데이터베이스 ORM
- **JWT (jjwt)** - JSON Web Token 인증
- **PostgreSQL / H2** - 데이터베이스

### Frontend
- **React 19** - UI 프레임워크
- **TypeScript** - 타입 안정성
- **Vite** - 빌드 도구
- **React Router** - 라우팅
- **Chart.js / react-chartjs-2** - 차트 라이브러리
- **Axios** - HTTP 클라이언트

---

## 📁 프로젝트 구조

```
AOP/
├── src/                    # 백엔드 소스 코드
│   └── main/
│       ├── java/           # Java 소스
│       └── resources/      # 설정 파일
├── frontend/               # 프론트엔드 소스 코드
│   └── src/
├── docs/                   # 프로젝트 문서
│   ├── 01-architecture/    # 아키텍처 문서
│   ├── 02-backend/         # 백엔드 문서
│   ├── 03-frontend/        # 프론트엔드 문서
│   └── 04-deployment/      # 배포 및 설정 문서
└── README.md               # 이 파일 (문서 인덱스)
```

자세한 프로젝트 구조는 [백엔드 개요](docs/02-backend/overview.md)와 [프론트엔드 개요](docs/03-frontend/overview.md)를 참고하세요.

---

## 🔑 주요 기능

### 현재 구현됨

#### 인증/인가
- ✅ JWT 기반 인증/인가
- ✅ 로그인/로그아웃 API
- ✅ 역할 기반 접근 제어 (RBAC)

#### 사용자 관리
- ✅ 사용자 CRUD API
- ✅ 관리자 사용자 관리
- ✅ 프로필 관리

#### 데이터 웨어하우스
- ✅ DW 레이어 (DimDate, FactSales, FactInventory, FactDowntime)
- ✅ Mart 레이어 (일별/주별/월별 집계)
- ✅ Dashboard 레이어 (DashboardMetric)
- ✅ ETL 서비스

#### 대시보드
- ✅ 대시보드 API
- ✅ React 기반 대시보드 UI
- ✅ Chart.js를 사용한 차트 시각화

---

## 📖 상세 문서

프로젝트의 상세한 내용은 다음 문서들을 참고하세요:

- **아키텍처**: [전체 시스템 아키텍처](docs/01-architecture/overview.md), [데이터 아키텍처](docs/01-architecture/data-architecture.md)
- **백엔드**: [백엔드 개요](docs/02-backend/overview.md), [인증/인가](docs/02-backend/authentication.md), [API 엔드포인트](docs/02-backend/api.md)
- **프론트엔드**: [프론트엔드 개요](docs/03-frontend/overview.md), [레이아웃 및 반응형](docs/03-frontend/layout.md)
- **배포**: [외부 접속 설정](docs/04-deployment/external-access.md), [데이터베이스 설정](docs/04-deployment/database-setup.md)

---

## 🤝 기여

이 프로젝트는 (주)씨앤케이피 내부 프로젝트입니다.

### 기여 방법
1. 이슈 생성: 버그 리포트나 기능 제안은 이슈로 등록해주세요.
2. Pull Request: 변경사항은 Pull Request를 통해 제출해주세요.
3. 코드 리뷰: 모든 변경사항은 코드 리뷰를 거쳐야 합니다.

기여 전에 프로젝트 관리자와 논의해주시기 바랍니다.

---

## 📝 라이선스

Copyright © (주)씨앤케이피. All rights reserved.

이 프로젝트는 (주)씨앤케이피의 라이선스 하에 제공됩니다.
