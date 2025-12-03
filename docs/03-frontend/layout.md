# 레이아웃 및 반응형

이 문서는 AOP 프로젝트의 프론트엔드 레이아웃 및 반응형 디자인을 설명합니다.

## 브레이크포인트

### 브레이크포인트 기준
- **모바일 모드**: 화면 너비 **1199px 이하** (`max-width: 1199px`)
- **데스크톱 모드**: 화면 너비 **1200px 이상** (`min-width: 1200px`)

### 중요 사항
⚠️ **이 프로젝트는 1200px을 기준으로 모바일/데스크톱을 구분합니다.**
- 일반적인 웹사이트(768px)와 다르게 **1200px**을 기준으로 사용합니다.
- 태블릿(768px ~ 1199px)도 모바일 모드로 처리됩니다.

## 모바일/데스크톱 모드 특징

### 모바일 모드 (≤ 1199px)
- **레이아웃**: 카드들이 세로로 쌓이는 Flex 레이아웃
- **헤더**: `position: fixed`로 상단에 고정되어 스크롤 시에도 항상 보임
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

## 모바일 헤더 Fixed 구현

### 구현 개요

모바일 환경(1199px 이하)에서 헤더가 스크롤 시에도 상단에 고정되도록 `position: fixed`를 사용하여 구현했습니다.

### 구현 방법

#### 1. 헤더 CSS 설정 (`frontend/src/styles/header.css`)

```css
/* 모바일 모드 (화면 너비 < 1200px) */
@media (max-width: 1199px) {
  header,
  .header {
    /* 모바일에서 헤더를 상단에 고정 */
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    z-index: 100; /* 다른 요소 위에 표시 */
  }

  header {
    padding: 0 16px;
    height: 56px;
    min-height: 56px;
  }
}
```

#### 2. 레이아웃 여백 조정 (`frontend/src/styles/appLayout.css`)

```css
/* 모바일 모드 (화면 너비 < 1200px) */
@media (max-width: 1199px) {
  .app-body {
    flex-direction: column;
    height: auto;
    /* 헤더가 고정되어 있으므로 상단 여백 추가 */
    padding-top: 56px; /* 헤더 높이만큼 */
  }
}
```

## 모바일 레이아웃 해결 방법

### 문제 상황
모바일 환경(1199px 이하)에서 대시보드 페이지를 볼 때:
1. **하단 검은 바탕 문제**: 화면 아래쪽에 불필요한 검은 공간이 생김
2. **내부 스크롤 생성**: 컨테이너 내부에 스크롤이 생성되어 body 레벨 스크롤이 작동하지 않음
3. **높이 계산 오류**: react-grid-layout이 모바일에서도 높이를 계산하여 레이아웃이 깨짐

### 해결 방법

#### 1. 전역 스타일 수정 (index.css)

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

#### 2. AppLayout 스타일 수정 (appLayout.css)

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
}
```

#### 4. UserDashboardPage.tsx 수정

```typescript
// 모바일 감지 (1200px 미만)
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const viewportWidth = window.innerWidth;
  const mobile = viewportWidth < 1200;  // 1200px 기준
  setIsMobile(mobile);
  
  // 모바일에서는 rowHeight를 최소화하여 높이 계산 무시
  if (mobile) {
    setResponsiveRowHeight(1);
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

## Reports 페이지 사이드바 Blur 효과

### 문제 상황

모바일 환경(1199px 이하)에서 Reports 페이지의 사이드바를 열면:
- Sheet의 나머지 열들은 blur 효과가 정상적으로 적용됨
- **첫 번째 열(고정 열)만 blur 효과가 적용되지 않음**
- 사이드바 메뉴까지 blur가 적용되는 문제 발생

### 해결 방법

#### 1. appLayout.css 수정

```css
/* 모바일 오버레이 배경 */
.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  z-index: 30;
  /* backdrop-filter 제거 - 사이드바까지 blur되는 것을 방지 */
}

/* 모바일에서 사이드바가 열려있을 때 app-main에만 blur 적용 */
@media (max-width: 1199px) {
  .app-root.sidebar-overlay-open .app-main {
    filter: blur(2px);
    pointer-events: none; /* 클릭 이벤트 차단 */
  }
  
  /* 사이드바는 blur에서 제외 */
  .app-root.sidebar-overlay-open .sidebar {
    filter: none !important;
    pointer-events: auto !important;
  }
}
```

#### 2. WorkshopKpiSheet.tsx 수정

```typescript
/**
 * 사이드바 상태에 따라 첫 번째 열에 blur 적용하는 함수
 */
const applyBlurToFirstColumn = () => {
  if (!hotTableRef.current) return;

  const hotInstance = hotTableRef.current?.hotInstance || hotTableRef.current;
  if (!hotInstance) return;

  const container = hotInstance.rootElement;
  if (!container) return;

  // 사이드바 상태 확인
  const appRoot = document.querySelector('.app-root');
  const isOpen = appRoot?.classList.contains('sidebar-overlay-open') || false;

  // 고정 열 요소 찾기 (ht_clone_left, ht_clone_top_left)
  const fixedLeftElements = container.querySelectorAll('.ht_clone_left, .ht_clone_top_left');
  
  if (fixedLeftElements.length > 0) {
    // 고정 열이 있는 경우 - 고정 열에 blur 적용
    fixedLeftElements.forEach((element: Element) => {
      const htmlElement = element as HTMLElement;
      if (isOpen) {
        htmlElement.style.filter = 'blur(2px)';
        htmlElement.style.pointerEvents = 'none';
      } else {
        htmlElement.style.filter = '';
        htmlElement.style.pointerEvents = '';
      }
    });
  }
};

/**
 * 사이드바 상태 변경 감지 및 blur 적용
 */
useEffect(() => {
  // MutationObserver로 클래스 변경 감지
  const observer = new MutationObserver(() => {
    applyBlurToFirstColumn();
  });
  
  const appRoot = document.querySelector('.app-root');
  if (appRoot) {
    observer.observe(appRoot, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  // Handsontable이 업데이트될 때마다 확인
  const interval = setInterval(() => {
    applyBlurToFirstColumn();
  }, 200);

  return () => {
    observer.disconnect();
    clearInterval(interval);
  };
}, []);
```

## Reports 페이지 테이블 무한 확장 문제

### 문제 상황

Reports 페이지에서 Handsontable을 사용한 테이블이 표시될 때:
1. **테이블 아래 흰색 화면이 무한히 늘어남**: 콘텐츠보다 훨씬 큰 빈 공간이 생성됨
2. **ResizeObserver 무한 루프**: 콘솔에 "ResizeObserver callback was fired too many times" 경고 발생
3. **레이아웃 깨짐**: 모바일에서 특히 심각하게 발생

### 원인 분석

1. **높이 제한 문제**: 모바일에서도 `height: calc(100vh - 64px)` 같은 고정 높이가 적용되어 콘텐츠가 작아도 최소 높이가 유지됨
2. **Flex 레이아웃 문제**: `flex: 1`이 모바일에서도 적용되어 컨테이너가 뷰포트 높이에 맞춰 늘어남
3. **ResizeObserver 무한 루프**: Handsontable의 ResizeObserver가 컨테이너 높이 변화를 감지하면서 무한 루프 발생
   - 컨테이너 높이 변경 → ResizeObserver 트리거 → 컬럼 너비 재계산 → 레이아웃 변경 → 컨테이너 높이 변경 → 반복

### 해결 방법

#### 1. ReportsPage.css 수정

모바일에서 모든 높이 제한을 제거하고 자연스러운 높이로 설정:

```css
/* 모바일 모드 (≤ 1199px) */
@media (max-width: 1199px) {
  .reports-page {
    /* 높이 제한 완전 제거 */
    height: auto !important;
    min-height: auto !important;
    max-height: none !important;
    overflow: visible !important; /* 스크롤은 body에서 처리 */
    padding: 16px;
  }
  
  .reports-page-content {
    /* 높이 제한 제거 */
    flex: none !important;
    height: auto !important;
    min-height: auto !important;
    max-height: none !important;
    overflow: visible !important;
  }
  
  .reports-card {
    /* 높이 제한 제거 */
    flex: none !important;
    height: auto !important;
    min-height: auto !important;
    max-height: none !important;
    overflow: visible !important;
  }
  
  .reports-card-body {
    /* 높이 제한 제거 및 overflow 제거 */
    flex: none !important;
    height: auto !important;
    min-height: auto !important;
    max-height: none !important;
    overflow: visible !important;
  }
}
```

#### 2. WorkshopKpiSheet.css 수정

모바일에서 컨테이너의 높이 제한 제거:

```css
/* 모바일 모드 (≤ 1199px): 높이 제한 제거 */
@media (max-width: 1199px) {
  .workshop-kpi-sheet-container {
    flex: none !important;
    height: auto !important;
    min-height: auto !important;
    max-height: none !important;
    overflow: visible !important;
  }
}
```

#### 3. WorkshopKpiSheet.tsx 수정

ResizeObserver에 debounce 추가 및 무한 루프 방지:

```typescript
useLayoutEffect(() => {
  const container = containerRef.current;
  if (!container) return;

  let timeoutId: NodeJS.Timeout | null = null;
  let lastWidth = 0;

  const calcColWidths = () => {
    const totalWidth = container.clientWidth;
    if (!totalWidth || totalWidth <= 0) return;
    
    // 너비가 변경되지 않았으면 계산하지 않음 (무한 루프 방지)
    if (totalWidth === lastWidth) return;
    lastWidth = totalWidth;

    // ... 컬럼 너비 계산 로직
  };

  // 초기 1회 계산
  calcColWidths();
  lastWidth = container.clientWidth;

  // 리사이즈 대응 (debounce 적용)
  const ro = new ResizeObserver((entries) => {
    // 이전 타이머 취소
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // debounce: 100ms 후에 실행
    timeoutId = setTimeout(() => {
      const entry = entries[0];
      if (entry) {
        const newWidth = entry.contentRect.width;
        // 너비만 확인 (높이 변화는 무시하여 무한 루프 방지)
        if (newWidth !== lastWidth && newWidth > 0) {
          calcColWidths();
        }
      }
    }, 100);
  });
  
  ro.observe(container);

  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    ro.disconnect();
  };
}, [columnCount]);
```

#### 4. Handsontable 높이 설정

모바일에서는 Handsontable의 높이를 자동으로 계산하도록 설정:

```typescript
// 모바일 여부 상태 (1200px 기준)
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => {
    const viewportWidth = window.innerWidth;
    setIsMobile(viewportWidth < 1200);
  };

  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);

// HotTable에서
<HotTable
  height={isMobile ? undefined : height} // 모바일에서는 높이 자동 계산, 데스크톱에서는 지정된 높이 사용
  // ... 기타 props
/>
```

### 해결 원리

1. **높이 제한 제거**: 모든 `min-height`, `max-height`, `height: calc()` 제거하여 콘텐츠 높이에 맞춰 자연스럽게 늘어나도록
2. **Flex 제거**: 모바일에서 `flex: 1`을 `flex: none`으로 변경하여 뷰포트 높이에 맞춰 늘어나지 않도록
3. **Overflow 제거**: 모든 컨테이너의 `overflow`를 `visible`로 설정하여 내부 스크롤 방지
4. **ResizeObserver 최적화**: 
   - debounce 추가 (100ms)하여 빈번한 호출 방지
   - 너비만 관찰하고 높이 변화는 무시하여 무한 루프 방지
   - 이전 너비와 비교하여 실제 변경 시에만 계산

### 주의사항

1. **ResizeObserver 사용 시**: 
   - 항상 debounce를 적용하여 무한 루프 방지
   - 높이 변화가 레이아웃에 영향을 주는 경우에만 높이를 관찰
   - 너비만 필요한 경우 높이 관찰을 피할 것

2. **Handsontable 사용 시**:
   - 모바일에서는 `height` prop을 `undefined`로 설정하여 자동 높이 계산
   - 데스크톱에서는 고정 높이를 사용하여 성능 최적화

3. **모바일 레이아웃**:
   - 모든 높이 제한을 제거하고 콘텐츠 높이에 맞춰 자연스럽게 늘어나도록 설정
   - `flex: 1` 대신 `flex: none` 사용

## 코드 참고 시 주의사항

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

## 관련 파일

### CSS 파일
- `frontend/src/index.css` - 전역 스타일 (1200px 기준)
- `frontend/src/styles/appLayout.css` - 앱 레이아웃 (1200px 기준)
- `frontend/src/styles/adminLayout.css` - 관리자 레이아웃 (1200px 기준)
- `frontend/src/styles/dashboard.css` - 대시보드 스타일 (1200px 기준)
- `frontend/src/styles/dashboardCard.css` - 카드 스타일 (1200px 기준)
- `frontend/src/styles/header.css` - 헤더 스타일 (1200px 기준)
- `frontend/src/styles/reports.css` - 리포트 스타일 (1200px 기준)
- `frontend/src/pages/ReportsPage.css` - 리포트 페이지 스타일 (1200px 기준)
- `frontend/src/components/report/WorkshopKpiSheet.css` - Workshop KPI 시트 스타일

### TypeScript 파일
- `frontend/src/pages/UserDashboardPage.tsx` - 대시보드 페이지 (모바일/데스크톱 전환 로직)
- `frontend/src/pages/ReportsPage.tsx` - 리포트 페이지 (검색/선택, Period 필터)
- `frontend/src/components/Header.tsx` - 헤더 컴포넌트 (사이드바 토글)
- `frontend/src/components/admin/AdminHeader.tsx` - 관리자 헤더 컴포넌트
- `frontend/src/components/report/WorkshopKpiSheet.tsx` - Workshop KPI 시트 컴포넌트

## 관련 문서

- [프론트엔드 개요](overview.md) - 프론트엔드 프로젝트 구조
- [컴포넌트](components.md) - 주요 컴포넌트 설명

