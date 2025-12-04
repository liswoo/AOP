# 프론트엔드 개요

이 문서는 AOP 프로젝트의 프론트엔드 구조와 기술 스택을 설명합니다.

## 기술 스택

- **React 19** - UI 프레임워크
- **TypeScript** - 타입 안정성
- **Vite** - 빌드 도구
- **React Router** - 라우팅
- **Chart.js / react-chartjs-2** - 차트 라이브러리
- **Axios** - HTTP 클라이언트
- **Handsontable** - 스프레드시트 컴포넌트
- **ExcelJS** - 엑셀 파일 생성 및 스타일링 라이브러리

## 프로젝트 구조

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
│   │       └── WorkshopKpiSheet.tsx
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
│       ├── appLayout.css
│       ├── dashboardCard.css
│       └── reports.css
│
├── package.json                      # npm 의존성
├── vite.config.ts                    # Vite 빌드 설정
└── tsconfig.json                     # TypeScript 설정
```

## 주요 기능

### 인증
- **로그인**: 사용자명과 비밀번호로 로그인
- **자동 인증**: localStorage에 저장된 토큰으로 자동 로그인 유지
- **로그아웃**: 로그아웃 및 토큰 제거
- **라우트 보호**: 인증이 필요한 페이지 자동 보호

### 대시보드
- **대시보드 카드**: 다양한 메트릭 표시
- **차트 시각화**: Chart.js를 사용한 차트
- **반응형 레이아웃**: 모바일/데스크톱 지원
- **그리드 레이아웃**: react-grid-layout 사용

### 사용자 관리 (관리자)
- **사용자 목록**: 페이지네이션 및 검색 지원
- **사용자 생성**: 새 사용자 계정 생성
- **사용자 수정**: 사용자 정보 수정
- **사용자 삭제**: 사용자 계정 삭제

### 프로필 관리
- **프로필 조회**: 현재 사용자 프로필 정보 표시
- **프로필 수정**: 프로필 정보 수정
- **비밀번호 변경**: 비밀번호 변경

### 리포트
- **리포트 검색**: 리포트 제목, 부제목, ID로 실시간 검색
- **리포트 선택**: 검색 결과에서 리포트 선택
- **Period 필터**: Last 7 Days, This Month, Last Month, Custom Range 옵션
- **Workshop KPI Sheet**: Handsontable을 사용한 스프레드시트 형태의 리포트 표시
- **엑셀 Export**: ExcelJS를 사용한 엑셀 파일 내보내기 (스타일 및 병합 유지)
- **반응형 레이아웃**: 모바일/데스크톱 지원

## 설치 및 실행

### 1. 의존성 설치

```bash
cd frontend
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

## 주요 설정

### Vite 설정

**파일**: `frontend/vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
```

### TypeScript 설정

**파일**: `frontend/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## API 클라이언트

### Axios 인스턴스 설정

**파일**: `frontend/src/api/client.ts`

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: JWT 토큰 자동 추가
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: 401 에러 시 로그아웃
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

## 인증 상태 관리

### AuthContext

**파일**: `frontend/src/auth/AuthContext.tsx`

```typescript
import { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // 토큰이 있으면 사용자 정보 조회
      authApi.getMe().then(setUser).catch(() => {
        localStorage.removeItem('token');
      });
    }
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem('token', token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

## 라우팅

### AppRouter

**파일**: `frontend/src/routes/AppRouter.tsx`

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth } from '../auth/RequireAuth';
import LoginPage from '../pages/LoginPage';
import UserDashboardPage from '../pages/UserDashboardPage';
import AdminUserListPage from '../pages/AdminUserListPage';
import ProfilePage from '../pages/ProfilePage';
import ReportsPage from '../pages/ReportsPage';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <UserDashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireAuth requiredRole="ADMIN">
              <AdminUserListPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/reports"
          element={
            <RequireAuth>
              <ReportsPage />
            </RequireAuth>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
```

## 관련 문서

- [레이아웃 및 반응형](layout.md) - 모바일/데스크톱 레이아웃 가이드
- [컴포넌트](components.md) - 주요 컴포넌트 설명
- [백엔드 API](../02-backend/api.md) - REST API 명세서

