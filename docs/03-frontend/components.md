# 컴포넌트

이 문서는 AOP 프로젝트의 주요 프론트엔드 컴포넌트를 설명합니다.

## 레이아웃 컴포넌트

### AppLayout

**위치**: `frontend/src/layout/AppLayout.tsx`

**설명**: 일반 사용자 레이아웃 컴포넌트

**주요 기능**:
- 헤더 표시
- 사이드바 표시 (모바일에서는 오버레이)
- 메인 콘텐츠 영역
- 반응형 레이아웃 지원

**Props**:
```typescript
interface AppLayoutProps {
  children: React.ReactNode;
}
```

### AdminLayout

**위치**: `frontend/src/layout/AdminLayout.tsx`

**설명**: 관리자 레이아웃 컴포넌트

**주요 기능**:
- 관리자 헤더 표시
- 관리자 사이드바 표시
- 메인 콘텐츠 영역
- 반응형 레이아웃 지원

## 인증 컴포넌트

### AuthContext

**위치**: `frontend/src/auth/AuthContext.tsx`

**설명**: 인증 상태 관리 Context

**주요 기능**:
- 사용자 정보 저장
- 로그인/로그아웃 함수 제공
- 토큰 관리

**사용 예시**:
```typescript
const { user, login, logout, isAuthenticated } = useAuth();
```

### RequireAuth

**위치**: `frontend/src/auth/RequireAuth.tsx`

**설명**: 인증이 필요한 페이지 보호 컴포넌트

**주요 기능**:
- 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
- 역할 기반 접근 제어 지원

**사용 예시**:
```typescript
<RequireAuth requiredRole="ADMIN">
  <AdminUserListPage />
</RequireAuth>
```

## 페이지 컴포넌트

### LoginPage

**위치**: `frontend/src/pages/LoginPage.tsx`

**설명**: 로그인 페이지

**주요 기능**:
- 사용자명/비밀번호 입력
- 로그인 API 호출
- 로그인 성공 시 토큰 저장 및 리다이렉트

### UserDashboardPage

**위치**: `frontend/src/pages/UserDashboardPage.tsx`

**설명**: 일반 사용자 대시보드 페이지

**주요 기능**:
- 대시보드 카드 표시
- 차트 시각화
- 반응형 그리드 레이아웃
- 모바일/데스크톱 전환 지원

### AdminUserListPage

**위치**: `frontend/src/pages/AdminUserListPage.tsx`

**설명**: 관리자 사용자 목록 페이지

**주요 기능**:
- 사용자 목록 표시
- 사용자 생성/수정/삭제
- 페이지네이션

### ProfilePage

**위치**: `frontend/src/pages/ProfilePage.tsx`

**설명**: 프로필 페이지

**주요 기능**:
- 프로필 정보 표시
- 프로필 정보 수정
- 비밀번호 변경

### ReportsPage

**위치**: `frontend/src/pages/ReportsPage.tsx`

**설명**: 리포트 페이지

**주요 기능**:
- 여러 리포트 검색 및 선택
  - 검색창: 리포트 제목, 부제목, ID로 실시간 검색
  - 선택창: 필터링된 리포트 목록에서 선택
  - 검색 결과 개수 표시
  - 검색 결과가 없을 때 명확한 피드백
  - 검색 결과에 따라 자동 선택
- Period 필터 기능
  - Last 7 Days, This Month, Last Month, Custom Range 옵션
  - Custom Range 선택 시 날짜 입력 필드 표시
- Workshop KPI Sheet 표시
  - Handsontable을 사용한 스프레드시트
  - Period 필터에 따라 Period 텍스트 자동 업데이트
- 반응형 레이아웃 지원
  - 1200px 기준 모바일/데스크톱 구분
  - 모바일: 필터 바 세로 배치, 검색창과 선택창 세로 배치
  - 데스크톱: 필터 바 가로 배치, 검색창과 선택창 가로 배치

**검색 기능 사용법**:
1. 검색창에 키워드 입력 (예: "Workshop", "KPI", "01")
2. 검색 결과가 드롭다운에 필터링되어 표시됨
3. 검색 결과 개수가 검색창 옆에 표시됨
4. 검색 결과가 있으면 첫 번째 결과가 자동으로 선택됨
5. 드롭다운에서 원하는 리포트 선택

**Period 필터 사용법**:
1. Period 옵션 선택 (Last 7 Days, This Month, Last Month, Custom Range)
2. Custom Range 선택 시 시작일과 종료일 입력
3. 선택한 기간에 따라 리포트의 Period 텍스트가 자동 업데이트됨

## 공통 컴포넌트

### Header

**위치**: `frontend/src/components/Header.tsx`

**설명**: 상단 헤더 컴포넌트

**주요 기능**:
- 로고 표시
- 햄버거 메뉴 (모바일)
- 프로필 드롭다운
- 로그아웃 버튼

### ProfileDropdown

**위치**: `frontend/src/components/ProfileDropdown.tsx`

**설명**: 프로필 드롭다운 메뉴

**주요 기능**:
- 사용자 정보 표시
- 프로필 페이지 링크
- 로그아웃 버튼

### ErrorBoundary

**위치**: `frontend/src/components/ErrorBoundary.tsx`

**설명**: 에러 바운더리 컴포넌트

**주요 기능**:
- React 에러 캐치
- 에러 메시지 표시
- 에러 복구 기능

## 대시보드 컴포넌트

### DashboardCard

**위치**: `frontend/src/components/dashboard/DashboardCard.tsx`

**설명**: 대시보드 카드 컴포넌트

**주요 기능**:
- 메트릭 표시
- 차트 표시
- 확장/축소 기능

**Props**:
```typescript
interface DashboardCardProps {
  id: string;
  title: string;
  type: 'summary' | 'chart';
  data?: any;
  onExpand?: (id: string) => void;
  onCollapse?: (id: string) => void;
}
```

### AiPromptModal

**위치**: `frontend/src/components/dashboard/AiPromptModal.tsx`

**설명**: AI 프롬프트 모달 컴포넌트

**주요 기능**:
- AI 프롬프트 입력
- AI 응답 표시

## 관리자 컴포넌트

### AdminHeader

**위치**: `frontend/src/components/admin/AdminHeader.tsx`

**설명**: 관리자 헤더 컴포넌트

**주요 기능**:
- 관리자 전용 헤더
- 사이드바 토글

### AdminSidebar

**위치**: `frontend/src/components/admin/AdminSidebar.tsx`

**설명**: 관리자 사이드바 컴포넌트

**주요 기능**:
- 관리자 메뉴 표시
- 메뉴 항목 클릭 시 페이지 이동

### AdminUserTable

**위치**: `frontend/src/components/admin/AdminUserTable.tsx`

**설명**: 관리자 사용자 테이블 컴포넌트

**주요 기능**:
- 사용자 목록 표시
- 사용자 정보 수정/삭제 버튼
- 페이지네이션

### AdminUserCreateForm

**위치**: `frontend/src/components/admin/AdminUserCreateForm.tsx`

**설명**: 사용자 생성 폼 컴포넌트

**주요 기능**:
- 사용자 정보 입력
- 사용자 생성 API 호출

## 리포트 컴포넌트

### ReportSheet

**위치**: `frontend/src/components/report/ReportSheet.tsx`

**설명**: 리포트 시트 컴포넌트

**주요 기능**:
- 리포트 데이터 표시
- Handsontable 통합

### WorkshopKpiSheet

**위치**: `frontend/src/components/report/WorkshopKpiSheet.tsx`

**설명**: Workshop KPI 시트 컴포넌트

**주요 기능**:
- Workshop KPI 데이터 표시
- Handsontable을 사용한 스프레드시트
- 사이드바 blur 효과 지원

## 관련 문서

- [프론트엔드 개요](overview.md) - 프론트엔드 프로젝트 구조
- [레이아웃 및 반응형](layout.md) - 모바일/데스크톱 레이아웃 가이드

