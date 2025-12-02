# 모바일 환경 레이아웃 문제 해결 가이드

## 문제 상황

모바일 환경(768px 이하)에서 대시보드 페이지를 볼 때 다음과 같은 문제가 발생했습니다:

1. **하단 검은 바탕 문제**: 화면 아래쪽에 불필요한 검은 공간이 생김
2. **내부 스크롤 생성**: 컨테이너 내부에 스크롤이 생성되어 body 레벨 스크롤이 작동하지 않음
3. **높이 계산 오류**: react-grid-layout이 모바일에서도 높이를 계산하여 레이아웃이 깨짐

## 해결 방법

### 1. 전역 스타일 수정 (index.css)

모바일에서 `html`, `body`, `#root`의 `min-height`를 제거하여 콘텐츠 높이에 맞춰 자연스럽게 늘어나도록 설정:

```css
@media (max-width: 768px) {
  html {
    height: auto;
    /* min-height 제거: 콘텐츠 높이에 맞춰 자연스럽게 늘어나도록 */
    overflow-x: hidden;
    overflow-y: auto; /* body 레벨에서 스크롤 처리 */
    background-color: #020617;
  }
  
  body {
    height: auto;
    /* min-height 제거: 콘텐츠 높이에 맞춰 자연스럽게 늘어나도록 */
    overflow-x: hidden;
    overflow-y: auto; /* body 레벨에서 스크롤 처리 */
    background-color: #020617;
  }
  
  #root {
    height: auto;
    /* min-height 제거: 콘텐츠 높이에 맞춰 자연스럽게 늘어나도록 */
    overflow: visible; /* 스크롤은 body에서 처리 */
    background-color: #020617;
    display: flex;
    flex-direction: column;
    min-height: auto !important; /* 명시적으로 제거 */
  }
}
```

**핵심 포인트:**
- `min-height: 100vh` 제거 → 콘텐츠 높이에 맞춰 자연스럽게 늘어남
- `body` 레벨에서만 스크롤 허용 (`overflow-y: auto`)
- 모든 레벨에서 배경색 통일 (`#020617`)

### 2. AppLayout 스타일 수정 (appLayout.css)

모바일에서 모든 컨테이너의 높이 제한을 제거하고 내부 스크롤을 방지:

```css
@media (max-width: 768px) {
  .app-root {
    /* 높이 제한 완전 제거 */
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
    /* 내부 스크롤 방지: 모든 스크롤은 body 레벨에서 처리 */
  }
}
```

**핵심 포인트:**
- 모든 높이 제한 제거 (`min-height`, `max-height`)
- `overflow: visible`로 설정하여 내부 스크롤 방지
- 배경색 통일

### 3. Dashboard 스타일 수정 (dashboard.css)

모바일에서 react-grid-layout을 flex 컨테이너로 변경하고 위치 계산을 무시:

```css
@media (max-width: 768px) {
  .dashboard-page-container {
    height: auto !important;
    min-height: auto !important;
    max-height: none !important;
    overflow-x: hidden !important;
    overflow-y: visible !important;
    padding: 0 8px;
    padding-bottom: 16px;
    background: transparent; /* 부모의 배경색 사용 */
  }
  
  .dashboard-grid-container {
    flex: none !important;
    height: auto !important;
    min-height: auto !important;
    max-height: none !important;
    overflow: visible !important;
  }
  
  .dashboard-grid {
    flex: none !important;
    height: auto !important;
    min-height: auto !important;
    max-height: none !important;
    overflow: visible !important;
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
    transform: none !important; /* CSS transform 제거 */
    left: auto !important;
    top: auto !important;
    right: auto !important;
    bottom: auto !important;
    margin-bottom: 16px !important; /* 카드 간 간격 */
    flex-shrink: 0;
  }
  
  .react-grid-item.react-grid-placeholder {
    display: none !important;
  }
  
  .dashboard-card-body {
    flex: none !important;
    height: auto !important;
    min-height: auto !important;
    max-height: none !important;
    overflow: visible !important;
  }
  
  .chart-container {
    flex: none !important;
    height: auto !important;
    min-height: auto !important;
    max-height: none !important;
    min-height: 200px; /* 차트가 너무 작아지지 않도록 최소 높이 설정 */
  }
}
```

**핵심 포인트:**
- `react-grid-layout`을 `flex` 컨테이너로 변경
- `react-grid-item`의 위치 계산 무시 (`transform: none`, `left: auto`, `top: auto`)
- 카드들이 자연스럽게 세로로 쌓이도록 설정

### 4. DashboardCard 스타일 수정 (dashboardCard.css)

모바일에서 카드의 높이 제한을 제거:

```css
@media (max-width: 768px) {
  .dashboard-card {
    height: auto !important;
    min-height: auto !important;
    max-height: none !important;
    /* 인라인 스타일의 height: 100%를 오버라이드 */
  }
}
```

**핵심 포인트:**
- 인라인 스타일의 `height: 100%`를 `!important`로 오버라이드

### 5. UserDashboardPage.tsx 수정

모바일에서 react-grid-layout의 `rowHeight`를 최소화:

```typescript
// 모바일 감지
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const viewportWidth = window.innerWidth;
  const mobile = viewportWidth <= 768;
  setIsMobile(mobile);
  
  // 모바일에서는 rowHeight를 최소화하여 높이 계산 무시
  if (mobile) {
    setResponsiveRowHeight(1); // 최소 높이로 설정
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

**핵심 포인트:**
- 모바일에서 `rowHeight`를 `1`로 설정하여 높이 계산 최소화

## 해결 원리

### 문제의 근본 원인

1. **높이 제한**: `min-height: 100vh`로 인해 콘텐츠가 작아도 최소 높이가 유지되어 빈 공간 발생
2. **내부 스크롤**: 컨테이너에 `overflow: hidden` 또는 높이 제한이 있어 내부 스크롤 생성
3. **react-grid-layout**: 모바일에서도 그리드 높이를 계산하여 불필요한 공간 생성

### 해결 원리

1. **높이 제한 제거**: 모든 `min-height`, `max-height` 제거하여 콘텐츠 높이에 맞춰 자연스럽게 늘어나도록
2. **스크롤 통합**: 모든 컨테이너의 `overflow`를 `visible`로 설정하고, `body` 레벨에서만 스크롤 처리
3. **Flex 레이아웃**: 모바일에서 `react-grid-layout`을 flex 컨테이너로 변경하여 카드들이 자연스럽게 세로로 쌓이도록
4. **위치 계산 무시**: `react-grid-item`의 위치 계산을 완전히 무시하고 자연스러운 흐름으로 렌더링

## 체크리스트

모바일 레이아웃 문제가 발생했을 때 확인할 사항:

- [ ] `html`, `body`, `#root`의 `min-height: 100vh` 제거 여부
- [ ] 모든 컨테이너의 `overflow`가 `visible`로 설정되어 있는지
- [ ] `body` 레벨에서만 `overflow-y: auto`가 설정되어 있는지
- [ ] 모든 배경색이 통일되어 있는지 (`#020617`)
- [ ] `react-grid-layout`이 모바일에서 flex 컨테이너로 동작하는지
- [ ] `react-grid-item`의 위치 계산이 무시되는지
- [ ] 카드의 높이 제한이 제거되었는지
- [ ] `rowHeight`가 모바일에서 최소화되었는지

## 참고 파일

- `frontend/src/index.css` - 전역 스타일
- `frontend/src/styles/appLayout.css` - 앱 레이아웃 스타일
- `frontend/src/styles/dashboard.css` - 대시보드 스타일
- `frontend/src/styles/dashboardCard.css` - 카드 스타일
- `frontend/src/pages/UserDashboardPage.tsx` - 대시보드 페이지 컴포넌트

## 추가 참고사항

- 모바일 브레이크포인트: `768px` 이하
- 배경색: `#020617` (다크 테마)
- 스크롤: `body` 레벨에서만 처리
- 레이아웃: 모바일에서는 flex 컨테이너 사용

