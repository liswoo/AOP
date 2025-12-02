# 모바일/데스크톱 반응형 레이아웃 가이드

## 📱 현재 브레이크포인트 현황

### 브레이크포인트 기준
- **모바일 모드**: 화면 너비 **1199px 이하** (`max-width: 1199px`)
- **데스크톱 모드**: 화면 너비 **1200px 이상** (`min-width: 1200px`)

### 중요 사항
⚠️ **이 프로젝트는 1200px을 기준으로 모바일/데스크톱을 구분합니다.**
- 일반적인 웹사이트(768px)와 다르게 **1200px**을 기준으로 사용합니다.
- 태블릿(768px ~ 1199px)도 모바일 모드로 처리됩니다.

---

## 🎯 모바일/데스크톱 모드 특징

### 모바일 모드 (≤ 1199px)
- **레이아웃**: 카드들이 세로로 쌓이는 Flex 레이아웃
- **사이드바**: 오버레이 형태로 표시 (햄버거 메뉴 클릭 시)
- **스크롤**: body 레벨에서만 스크롤 처리
- **그리드**: react-grid-layout의 위치 계산 무시, 자연스러운 흐름으로 렌더링
- **rowHeight**: 최소값(1)으로 설정하여 높이 계산 최소화

### 데스크톱 모드 (≥ 1200px)
- **레이아웃**: 2행 3열 그리드 레이아웃 (react-grid-layout 사용)
- **사이드바**: 항상 표시, 접었다 펼 수 있음
- **스크롤**: 뷰포트 고정, 내부 스크롤 없음
- **그리드**: 12열 그리드 시스템 사용
- **rowHeight**: 뷰포트 높이에 맞춰 동적 계산

---

## 🐛 주요 버그 및 해결 방법

### 버그: 모바일 → 데스크톱 전환 시 카드가 작게 표시되는 문제

#### 문제 상황
화면을 점점 줄여서 모바일 모드로 갔다가, 다시 늘려서 데스크톱 모드로 돌아오는 경우:
- 카드가 작은 형태로 표시됨
- F5로 새로고침하면 정상적으로 표시됨
- 그 이후에는 정상 작동

#### 원인
1. **`isMobile` 상태가 동기화되지 않음**: 창 크기 변경 시 `isMobile` 상태가 업데이트되지 않아 `rowHeight`가 잘못 계산됨
2. **`onBreakpointChange`에서 잘못된 브레이크포인트 기준 사용**: 768px 기준으로 체크하여 1200px 전환 시 레이아웃이 재계산되지 않음
3. **레이아웃 상태 업데이트 지연**: `currentCols`와 `isMobile` 상태가 비동기적으로 업데이트되어 레이아웃이 즉시 반영되지 않음

#### 해결 방법

**1. `handleResize`에서 `isMobile` 상태 동기화**
```typescript
// frontend/src/pages/UserDashboardPage.tsx
useEffect(() => {
  const handleResize = () => {
    const viewportWidth = window.innerWidth;
    const newMobile = viewportWidth < 1200;  // 1200px 기준
    const newCols = getCurrentCols();
    
    // isMobile 상태 업데이트
    if (newMobile !== isMobile) {
      setIsMobile(newMobile);
    }
    
    // currentCols 상태 업데이트
    if (newCols !== currentCols) {
      setCurrentCols(newCols);
    }
  };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, [currentCols, isMobile]);
```

**2. `onBreakpointChange`에서 올바른 브레이크포인트 기준 사용**
```typescript
// frontend/src/pages/UserDashboardPage.tsx
onBreakpointChange={(newBreakpoint, newCols) => {
  if (!expandedGridCardId) {
    const viewportWidth = window.innerWidth;
    const isDesktop = viewportWidth >= 1200;  // 1200px 기준
    
    // isMobile 상태 즉시 업데이트
    setIsMobile(!isDesktop);
    
    // currentCols 업데이트 (baseLayout 재계산 트리거)
    const newColsValue = getCurrentCols();
    if (newColsValue !== currentCols) {
      setCurrentCols(newColsValue);
    }
    
    // 레이아웃 즉시 재계산
    const layoutCols = isDesktop ? 12 : newCols;
    const newLayout = computeLayout(activeCards, layoutCols);
    setLayout(newLayout);
  }
}}
```

**3. 헤더 컴포넌트에서도 올바른 브레이크포인트 사용**
```typescript
// frontend/src/components/Header.tsx
const handleMenuClick = () => {
  const isMobile = window.innerWidth < 1200;  // 1200px 기준
  if (isMobile && onOpenMobileSidebar) {
    onOpenMobileSidebar();
  } else if (!isMobile && onToggleSidebar) {
    onToggleSidebar();
  }
};
```

---

## 📝 코드 참고 시 주의사항

### ⚠️ 절대 하지 말아야 할 것

1. **브레이크포인트를 768px로 하드코딩하지 말 것**
   ```typescript
   // ❌ 잘못된 예
   const isMobile = window.innerWidth < 768;
   
   // ✅ 올바른 예
   const isMobile = window.innerWidth < 1200;
   ```

2. **CSS 미디어 쿼리에서 768px 사용하지 말 것**
   ```css
   /* ❌ 잘못된 예 */
   @media (max-width: 768px) { ... }
   
   /* ✅ 올바른 예 */
   @media (max-width: 1199px) { ... }
   ```

3. **`onBreakpointChange`에서 `newCols >= 6` 같은 조건 사용하지 말 것**
   ```typescript
   // ❌ 잘못된 예
   const layoutCols = newCols >= 6 ? 12 : newCols;
   
   // ✅ 올바른 예
   const viewportWidth = window.innerWidth;
   const isDesktop = viewportWidth >= 1200;
   const layoutCols = isDesktop ? 12 : newCols;
   ```

### ✅ 올바른 패턴

1. **모바일 감지**
   ```typescript
   const isMobile = window.innerWidth < 1200;
   ```

2. **데스크톱 감지**
   ```typescript
   const isDesktop = window.innerWidth >= 1200;
   ```

3. **CSS 미디어 쿼리**
   ```css
   /* 모바일 */
   @media (max-width: 1199px) {
     /* 모바일 스타일 */
   }
   
   /* 데스크톱 */
   @media (min-width: 1200px) {
     /* 데스크톱 스타일 */
   }
   ```

4. **상태 업데이트 시 동기화**
   ```typescript
   // 창 크기 변경 시 isMobile과 currentCols를 함께 업데이트
   const handleResize = () => {
     const viewportWidth = window.innerWidth;
     const newMobile = viewportWidth < 1200;
     const newCols = getCurrentCols();
     
     if (newMobile !== isMobile) {
       setIsMobile(newMobile);
     }
     if (newCols !== currentCols) {
       setCurrentCols(newCols);
     }
   };
   ```

---

## 🔧 주요 파일 및 위치

### 브레이크포인트 관련 파일

#### CSS 파일
- `frontend/src/index.css` - 전역 스타일 (1200px 기준)
- `frontend/src/styles/appLayout.css` - 앱 레이아웃 (1200px 기준)
- `frontend/src/styles/adminLayout.css` - 관리자 레이아웃 (1200px 기준)
- `frontend/src/styles/dashboard.css` - 대시보드 스타일 (1200px 기준)
- `frontend/src/styles/dashboardCard.css` - 카드 스타일 (1200px 기준)
- `frontend/src/styles/header.css` - 헤더 스타일 (1200px 기준)
- `frontend/src/styles/reports.css` - 리포트 스타일 (1200px 기준)

#### TypeScript/JavaScript 파일
- `frontend/src/pages/UserDashboardPage.tsx` - 대시보드 페이지 (모바일/데스크톱 전환 로직)
- `frontend/src/components/Header.tsx` - 헤더 컴포넌트 (사이드바 토글)
- `frontend/src/components/admin/AdminHeader.tsx` - 관리자 헤더 컴포넌트

---

## 🎨 모바일 레이아웃 해결 방법

### 문제 상황
모바일 환경(1199px 이하)에서 대시보드 페이지를 볼 때:
1. **하단 검은 바탕 문제**: 화면 아래쪽에 불필요한 검은 공간이 생김
2. **내부 스크롤 생성**: 컨테이너 내부에 스크롤이 생성되어 body 레벨 스크롤이 작동하지 않음
3. **높이 계산 오류**: react-grid-layout이 모바일에서도 높이를 계산하여 레이아웃이 깨짐

### 해결 방법

#### 1. 전역 스타일 수정 (index.css)

모바일에서 `html`, `body`, `#root`의 `min-height`를 제거하여 콘텐츠 높이에 맞춰 자연스럽게 늘어나도록 설정:

```css
/* 모바일 (1199px 이하): 자연스러운 높이, 스크롤 허용 */
@media (max-width: 1199px) {
  html {
    height: auto;
    overflow-x: hidden;
    overflow-y: auto; /* body 레벨에서 스크롤 처리 */
    background-color: #020617;
  }
  
  body {
    height: auto;
    overflow-x: hidden;
    overflow-y: auto; /* body 레벨에서 스크롤 처리 */
    background-color: #020617;
  }
  
  #root {
    height: auto;
    overflow: visible; /* 스크롤은 body에서 처리 */
    background-color: #020617;
    display: flex;
    flex-direction: column;
    min-height: auto !important;
  }
}

/* 데스크톱 (1200px 이상): 뷰포트 고정, 스크롤 제거 */
@media (min-width: 1200px) {
  html, body, #root {
    height: 100%;
    overflow: hidden;
  }
}
```

**핵심 포인트:**
- `min-height: 100vh` 제거 → 콘텐츠 높이에 맞춰 자연스럽게 늘어남
- `body` 레벨에서만 스크롤 허용 (`overflow-y: auto`)
- 모든 레벨에서 배경색 통일 (`#020617`)

#### 2. AppLayout 스타일 수정 (appLayout.css)

모바일에서 모든 컨테이너의 높이 제한을 제거하고 내부 스크롤을 방지:

```css
/* 모바일 (1199px 이하): 자연스러운 높이, 스크롤 허용 */
@media (max-width: 1199px) {
  .app-root {
    height: auto !important;
    min-height: auto !important;
    max-height: none !important;
    overflow: visible !important;
    background: #020617 !important;
    display: flex !important;
    flex-direction: column !important;
  }
  
  .app-body {
    flex: none !important;
    height: auto !important;
    min-height: auto !important;
    max-height: none !important;
    overflow: visible !important;
    background: #020617;
    display: flex !important;
    width: 100%;
  }
  
  .app-main {
    flex: none !important;
    height: auto !important;
    min-height: auto !important;
    max-height: none !important;
    overflow: visible !important;
    padding-bottom: 20px;
    width: 100%;
  }
}
```

#### 3. Dashboard 스타일 수정 (dashboard.css)

모바일에서 react-grid-layout을 flex 컨테이너로 변경하고 위치 계산을 무시:

```css
/* 모바일 (1199px 이하): 자연스러운 높이, 세로 스크롤 허용 */
@media (max-width: 1199px) {
  .dashboard-page-container {
    height: auto !important;
    min-height: auto !important;
    max-height: none !important;
    overflow-x: hidden !important;
    overflow-y: visible !important;
    padding: 0 8px;
    padding-bottom: 16px;
    background: transparent;
  }
  
  .react-grid-layout {
    height: auto !important;
    max-height: none !important;
    width: 100% !important;
    overflow: visible !important;
    position: relative !important;
    /* 모바일에서 flex 컨테이너로 변경하여 자연스럽게 쌓이도록 */
    display: flex !important;
    flex-direction: column !important;
  }
  
  .react-grid-item {
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    /* react-grid-layout의 위치 계산 완전히 무시 */
    position: relative !important;
    transform: none !important;
    left: auto !important;
    top: auto !important;
    right: auto !important;
    bottom: auto !important;
    margin-bottom: 16px !important;
    flex-shrink: 0;
  }
  
  .react-grid-item.react-grid-placeholder {
    display: none !important;
  }
}
```

#### 4. UserDashboardPage.tsx 수정

모바일에서 react-grid-layout의 `rowHeight`를 최소화:

```typescript
// 모바일 감지 (1200px 미만)
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const viewportWidth = window.innerWidth;
  const mobile = viewportWidth < 1200;  // 1200px 기준
  setIsMobile(mobile);
  
  // 모바일에서는 rowHeight를 최소화하여 높이 계산 무시
  if (mobile) {
    setResponsiveRowHeight(50);
    return;
  }
  // ... 데스크톱 로직
}, []);

// ResponsiveGridLayout에서
<ResponsiveGridLayout
  rowHeight={isMobile ? 1 : responsiveRowHeight} // 모바일에서는 최소 높이
  // ... 기타 props
/>
```

---

## 🔍 해결 원리

### 문제의 근본 원인

1. **높이 제한**: `min-height: 100vh`로 인해 콘텐츠가 작아도 최소 높이가 유지되어 빈 공간 발생
2. **내부 스크롤**: 컨테이너에 `overflow: hidden` 또는 높이 제한이 있어 내부 스크롤 생성
3. **react-grid-layout**: 모바일에서도 그리드 높이를 계산하여 불필요한 공간 생성
4. **상태 동기화 실패**: 모바일/데스크톱 전환 시 `isMobile`과 `currentCols` 상태가 동기화되지 않음

### 해결 원리

1. **높이 제한 제거**: 모든 `min-height`, `max-height` 제거하여 콘텐츠 높이에 맞춰 자연스럽게 늘어나도록
2. **스크롤 통합**: 모든 컨테이너의 `overflow`를 `visible`로 설정하고, `body` 레벨에서만 스크롤 처리
3. **Flex 레이아웃**: 모바일에서 `react-grid-layout`을 flex 컨테이너로 변경하여 카드들이 자연스럽게 세로로 쌓이도록
4. **위치 계산 무시**: `react-grid-item`의 위치 계산을 완전히 무시하고 자연스러운 흐름으로 렌더링
5. **상태 동기화**: 창 크기 변경 시 `isMobile`과 `currentCols`를 함께 업데이트하여 레이아웃이 즉시 반영되도록

---

## ✅ 체크리스트

모바일 레이아웃 문제가 발생했을 때 확인할 사항:

- [ ] 브레이크포인트가 **1200px** 기준으로 설정되어 있는지 확인
- [ ] `html`, `body`, `#root`의 `min-height: 100vh` 제거 여부
- [ ] 모든 컨테이너의 `overflow`가 `visible`로 설정되어 있는지
- [ ] `body` 레벨에서만 `overflow-y: auto`가 설정되어 있는지
- [ ] 모든 배경색이 통일되어 있는지 (`#020617`)
- [ ] `react-grid-layout`이 모바일에서 flex 컨테이너로 동작하는지
- [ ] `react-grid-item`의 위치 계산이 무시되는지
- [ ] 카드의 높이 제한이 제거되었는지
- [ ] `rowHeight`가 모바일에서 최소화되었는지
- [ ] `isMobile` 상태가 창 크기 변경 시 즉시 업데이트되는지
- [ ] `onBreakpointChange`에서 **1200px** 기준을 사용하는지

---

## 📚 참고 파일

### CSS 파일
- `frontend/src/index.css` - 전역 스타일
- `frontend/src/styles/appLayout.css` - 앱 레이아웃 스타일
- `frontend/src/styles/adminLayout.css` - 관리자 레이아웃 스타일
- `frontend/src/styles/dashboard.css` - 대시보드 스타일
- `frontend/src/styles/dashboardCard.css` - 카드 스타일
- `frontend/src/styles/header.css` - 헤더 스타일
- `frontend/src/styles/reports.css` - 리포트 스타일

### TypeScript 파일
- `frontend/src/pages/UserDashboardPage.tsx` - 대시보드 페이지 컴포넌트
- `frontend/src/components/Header.tsx` - 헤더 컴포넌트
- `frontend/src/components/admin/AdminHeader.tsx` - 관리자 헤더 컴포넌트

---

## 📌 추가 참고사항

- **모바일 브레이크포인트**: **1199px 이하** (`max-width: 1199px`)
- **데스크톱 브레이크포인트**: **1200px 이상** (`min-width: 1200px`)
- **배경색**: `#020617` (다크 테마)
- **스크롤**: `body` 레벨에서만 처리
- **레이아웃**: 모바일에서는 flex 컨테이너 사용
- **react-grid-layout breakpoints**: `{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }`
  - ⚠️ 주의: react-grid-layout의 breakpoints는 라이브러리 내부용이며, 실제 모바일/데스크톱 구분은 **1200px** 기준입니다.

---

## 🚨 중요 경고

**이 프로젝트에서 모바일/데스크톱을 구분하는 기준은 1200px입니다.**

- 일반적인 웹사이트(768px)와 다릅니다.
- 새로운 컴포넌트를 추가할 때는 반드시 **1200px** 기준을 사용해야 합니다.
- 기존 코드를 수정할 때도 **1200px** 기준을 유지해야 합니다.
- CSS 미디어 쿼리, JavaScript 조건문 모두 **1200px** 기준으로 작성해야 합니다.
