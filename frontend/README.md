# 어드민 프론트엔드

Spring Boot 백엔드와 연동되는 React 어드민 화면입니다.

## 기술 스택

- **Vite**: 빠른 빌드 도구
- **React 18**: UI 라이브러리
- **TypeScript**: 타입 안정성
- **React Router v6**: 라우팅
- **Axios**: HTTP 클라이언트

## 프로젝트 구조

```
frontend/
├── src/
│   ├── api/              # API 호출 함수들
│   │   ├── client.ts     # Axios 인스턴스 설정
│   │   ├── authApi.ts    # 인증 관련 API
│   │   └── adminUserApi.ts # 사용자 관리 API
│   ├── auth/             # 인증 관련
│   │   ├── AuthContext.tsx  # 인증 컨텍스트 (전역 상태 관리)
│   │   └── RequireAuth.tsx  # 라우트 보호 컴포넌트
│   ├── pages/            # 페이지 컴포넌트
│   │   ├── LoginPage.tsx
│   │   └── AdminUserListPage.tsx
│   ├── components/       # 재사용 가능한 컴포넌트
│   │   ├── AdminUserTable.tsx
│   │   └── AdminUserCreateForm.tsx
│   ├── routes/           # 라우터 설정
│   │   └── AppRouter.tsx
│   ├── types/            # TypeScript 타입 정의
│   │   └── index.ts
│   ├── main.tsx          # 애플리케이션 진입점
│   └── index.css         # 전역 CSS
```

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

개발 서버는 `http://localhost:5173`에서 실행됩니다.

### 3. 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 폴더에 생성됩니다.

## 사용 방법

1. 백엔드 서버가 `http://localhost:8080`에서 실행 중이어야 합니다.
2. 브라우저에서 `http://localhost:5173`에 접속합니다.
3. 로그인 페이지에서 다음 정보로 로그인:
   - 사용자명: `admin`
   - 비밀번호: `admin1234`
4. 로그인 성공 시 사용자 목록 페이지로 자동 이동합니다.

## 주요 기능

### 인증 (Authentication)

- **로그인**: 사용자명과 비밀번호로 로그인
- **자동 인증**: localStorage에 저장된 토큰으로 자동 로그인 유지
- **로그아웃**: 로그아웃 및 토큰 제거

### 사용자 관리

- **사용자 목록 조회**: 페이지네이션 및 검색 지원
- **사용자 생성**: 새 사용자 계정 생성
- **사용자 정보 표시**: ID, 사용자명, 이름, 이메일, 역할, 상태, 생성일

## API 엔드포인트

### 인증

- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보 조회

### 사용자 관리 (ADMIN 권한 필요)

- `GET /api/admin/users` - 사용자 목록 조회
- `POST /api/admin/users` - 사용자 생성

## 주의사항

- 백엔드 CORS 설정이 `http://localhost:5173`을 허용해야 합니다.
- 모든 API 요청은 `http://localhost:8080/api`를 기본 URL로 사용합니다.
- 인증이 필요한 API는 자동으로 Authorization 헤더에 Bearer 토큰을 추가합니다.
