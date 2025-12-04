# 이슈 해결 로그

이 문서는 프로젝트 개발 중 발생한 주요 이슈와 해결 방법을 시간순으로 정리한 문서입니다.

---

## 2025-12-03

### 이슈: 프로젝트 구조 분석 및 README.md 업데이트

**질문**: 프로젝트 구조를 분석하고 최상단 README.md를 현재 상황에 맞게 수정해달라.

**해결**:
- 프로젝트 구조 분석 완료
  - 풀스택 애플리케이션 (Spring Boot + React)
  - 3계층 데이터 웨어하우스 아키텍처 (DW → Mart → Dashboard)
  - JWT 인증 시스템 구현 완료
  - 프론트엔드 React 19 + TypeScript 구현 완료
- README.md 업데이트
  - 기술 스택 정보 업데이트 (JWT 구현 완료 반영)
  - 프로젝트 구조에 DW/Mart/ETL 모듈 추가
  - 프론트엔드 구조 섹션 추가
  - 데이터 아키텍처 섹션 추가
  - API 엔드포인트 목록 추가
  - 초기 계정 정보 추가

---

### 이슈: 문서 정리 및 인덱스 생성

**질문**: 프로젝트 내 문서들을 정리하고, 문서 인덱스를 만들어서 앞으로도 내용을 추가하면서 관리하고 싶다.

**해결**:
- README.md를 문서 인덱스로 변경
  - 빠른 시작 가이드 유지
  - 상세 내용은 docs 폴더로 링크
- docs 폴더 구조 생성
  - `01-architecture/` - 전체 아키텍처 문서
  - `02-backend/` - 백엔드 문서
  - `03-frontend/` - 프론트엔드 문서
  - `04-deployment/` - 배포 및 설정 문서
- 문서 작성 완료
  - 아키텍처: overview.md, data-architecture.md
  - 백엔드: overview.md, authentication.md, api.md, database.md
  - 프론트엔드: overview.md, layout.md, components.md
  - 배포: external-access.md, database-setup.md
- 기존 문서 파일 정리
  - PROJECT_ARCHITECTURE.md → backup
  - EXTERNAL_ACCESS_GUIDE.md → backup
  - DATA_ARCHITECTURE.md → backup
  - MOBILE_LAYOUT_FIX.md → backup

---

### 이슈: frontend/README.md 처리

**질문**: frontend 폴더 안에 있는 README.md는 이제 삭제해도 되는건가?

**해결**:
- frontend/README.md 내용 확인
  - 대부분 docs/03-frontend/overview.md에 중복
  - 일부 정보 오래됨 (React 18 → React 19)
- 간단한 링크 버전으로 대체
  - 빠른 시작 가이드만 유지
  - 상세 문서로 연결하는 링크 추가
  - frontend 폴더에서 바로 관련 문서 찾을 수 있도록 개선

---

### 이슈: 라이선스 정보 추가

**질문**: README 부분의 라이선스에, (주)씨앤케이피의 라이선스라는 내용을 추가하고 싶다.

**해결**:
- 라이선스 섹션 업데이트
  - Copyright © (주)씨앤케이피. All rights reserved.
  - 이 프로젝트는 (주)씨앤케이피의 라이선스 하에 제공됩니다.

---

### 이슈: 기여 섹션 내용 작성

**질문**: 기여 부분에는 무엇을 적어야할까?

**해결**:
- 회사 내부 프로젝트용 상세 버전으로 작성
  - (주)씨앤케이피 내부 프로젝트임을 명시
  - 기여 방법 3가지 (이슈 생성, Pull Request, 코드 리뷰)
  - 프로젝트 관리자와 사전 논의 안내

---

### 이슈: Reports 페이지 테이블 무한 확장 문제

**질문**: Reports 페이지에서 테이블 아래쪽 흰색 화면이 무한히 늘어나고 있다.

**해결**:
- 문제 원인 분석
  - 모바일에서도 고정 높이(`height: calc(100vh - 64px)`)가 적용되어 빈 공간 생성
  - `flex: 1`이 모바일에서도 적용되어 컨테이너가 뷰포트 높이에 맞춰 늘어남
  - Handsontable의 ResizeObserver가 무한 루프 발생
- 해결 방법 적용
  - ReportsPage.css: 모바일에서 모든 높이 제한 제거 (`height: auto`, `flex: none`, `overflow: visible`)
  - WorkshopKpiSheet.css: 모바일에서 컨테이너 높이 제한 제거
  - WorkshopKpiSheet.tsx: ResizeObserver에 debounce 추가 (100ms), 너비만 관찰하여 무한 루프 방지
  - Handsontable 높이: 모바일에서는 `undefined`로 설정하여 자동 높이 계산
- 설명서 업데이트
  - `docs/03-frontend/layout.md`에 "Reports 페이지 테이블 무한 확장 문제" 섹션 추가
  - 해결 원리 및 주의사항 포함

---

## 2025-12-04

### 이슈: Reports 페이지 기능 추가

**질문**: Reports 페이지에 여러 리포트 검색/선택 기능 및 기간 필터 기능을 추가하고, 기존 레이아웃이 망가지지 않도록 주의해달라.

**해결**:
- 리포트 타입 정의 및 여러 리포트 생성
  - 기존 WorkshopKpiSheet를 활용하여 리포트 3개 생성 (Report 01, 02, 03)
- 검색 및 선택 기능 구현
  - 검색창: 리포트 제목/부제목/ID로 실시간 검색
  - 선택창: 필터링된 리포트 목록에서 선택
  - 검색과 선택을 동시에 사용 가능
- Period 필터 기능 추가
  - Dashboard의 Period 필터 구조 참고
  - Last 7 Days, This Month, Last Month, Custom Range 옵션 제공
  - Custom Range 선택 시 날짜 입력 필드 표시
- 레이아웃 반응형 처리
  - 1200px 기준 모바일/데스크톱 구분
  - 모바일: 필터 바 세로 배치, 검색창과 선택창 세로 배치, 스크롤 허용
  - 데스크톱: 필터 바 가로 배치, 검색창과 선택창 가로 배치, 고정 높이, 내부 스크롤
- 설명서 준수
  - `docs/03-frontend/layout.md`의 레이아웃 가이드라인 준수
  - 1200px 기준 브레이크포인트 사용

---

### 이슈: Reports 페이지 테이블 무한 확장 문제

**질문**: Reports 페이지에서 테이블 아래쪽 흰색 화면이 무한히 늘어나고 있다.

**해결**:
- 문제 원인 분석
  - 모바일에서도 고정 높이(`height: calc(100vh - 64px)`)가 적용되어 빈 공간 생성
  - `flex: 1`이 모바일에서도 적용되어 컨테이너가 뷰포트 높이에 맞춰 늘어남
  - Handsontable의 ResizeObserver가 무한 루프 발생
- 해결 방법 적용
  - ReportsPage.css: 모바일에서 모든 높이 제한 제거 (`height: auto`, `flex: none`, `overflow: visible`)
  - WorkshopKpiSheet.css: 모바일에서 컨테이너 높이 제한 제거
  - WorkshopKpiSheet.tsx: ResizeObserver에 debounce 추가 (100ms), 너비만 관찰하여 무한 루프 방지
  - Handsontable 높이: 모바일에서는 `undefined`로 설정하여 자동 높이 계산
- 설명서 업데이트
  - `docs/03-frontend/layout.md`에 "Reports 페이지 테이블 무한 확장 문제" 섹션 추가
  - 해결 원리 및 주의사항 포함

---

### 이슈: Reports 페이지 검색 기능 개선

**질문**: 리포트 검색창에 "Workshop"이라고 검색해도 아무 반응이 없는데, 어떻게 사용해야 하는거지? 아직 기능구현이 안되어있나?

**해결**:
- 문제 원인 분석
  - 검색 기능은 구현되어 있었지만, 사용자 피드백이 부족함
  - 검색 결과가 드롭다운에만 반영되어 사용자가 결과를 확인하기 어려움
  - 검색 결과가 없을 때 명확한 피드백 부족
- 해결 방법 적용
  - 자동 선택 기능: 검색 결과가 있고 현재 선택된 리포트가 필터링된 목록에 없으면 첫 번째 결과로 자동 선택
  - 검색 결과 개수 표시: 검색창 옆에 "(N개 검색됨)" 표시 추가
  - 검색 결과 없음 처리: 드롭다운에 "검색 결과가 없습니다" 메시지 표시
  - 검색 대상: 리포트 제목, 부제목, ID 모두 검색 가능
- 사용자 경험 개선
  - 검색 즉시 결과 반영
  - 검색 결과 개수로 피드백 제공
  - 자동 선택으로 편의성 향상

---

### 이슈: Reports 페이지 엑셀 Export 기능 추가

**질문**: Handsontable의 자체 export 기능은 없는지, 그리고 컬럼 색상, 셀 병합 등이 엑셀에서 표현되지 않는 문제를 해결할 수 있는지.

**해결**:
- Handsontable export 기능 확인
  - Handsontable의 `exportFile` 플러그인은 CSV만 지원하고 XLSX는 지원하지 않음
  - 따라서 외부 라이브러리 사용이 필수적임
- 라이브러리 선택 및 전환
  - 초기 구현: SheetJS (xlsx) 사용 - 데이터만 export 가능
  - 문제: 스타일(색상, 병합) 미지원
  - 해결: ExcelJS로 전환 - 스타일 및 병합 지원
- 스타일 적용 구현
  - Title 행: 빨간 배경 (#B91C1C), 흰색 텍스트, 중앙 정렬
  - Period 행: 연한 회색 배경 (#F9FAFB), 좌측 정렬
  - Section 행: 빨간 배경 (#DC2626), 흰색 텍스트, 좌측 정렬
  - Metric 숫자 셀: 우측 정렬, 천 단위 구분 기호
  - 음수 값: 빨간색 텍스트
  - 헤더 행: 회색 배경, 굵은 글씨
- 셀 병합 구현
  - Title, Period, Section 행을 전체 컬럼에 병합
  - `WORKSHOP_KPI_ROWS` 기반으로 병합 정보 계산
- 추가 기능
  - 모든 셀에 테두리 적용
  - 컬럼 너비 유지
  - 행 높이 설정
  - 파일명: `{리포트 제목}_{날짜}.xlsx`
- UI 개선
  - 리포트 카드 헤더 오른쪽에 "Export Excel" 버튼 추가
  - 그라데이션 배경 (#8b5cf6 → #3b82f6)
  - 다운로드 아이콘 포함
  - 모바일 반응형 지원

---

### 이슈: 의존성 관리 및 버전 호환성 대비 방안

**질문**: 현재 설치된 라이브러리 등은 로컬에 설치된 것인데, 향후 Java 버전이나 Gradle 버전 등에 의해서 사용하지 못하게 될 가능성이 있는지, 그리고 어떻게 대비해야 하는지.

**해결**:
- 현재 상태 분석
  - 백엔드: Gradle Wrapper로 Gradle 8.5 고정, build.gradle에 Java 17 명시
  - 프론트엔드: package-lock.json으로 npm 의존성 버전 고정
  - 모든 버전 관리 파일이 Git에 커밋되어 있음
- 버전 호환성 문제 가능성 분석
  - Java 버전 변경: 높음 (Spring Boot 3.2.0은 Java 17 이상 필요)
  - Gradle 버전 변경: 중간 (Gradle 8.5는 Java 17과 호환)
  - Node.js 버전 변경: 중간 (React 19는 Node.js 18 이상 필요)
  - 의존성 라이브러리: 낮음 (package-lock.json으로 보호됨)
- 대비 방안 문서화
  - `docs/04-deployment/dependencies.md` 문서 생성
  - 버전 고정 파일 관리 방법 설명
  - 요구사항 문서화 방법
  - 의존성 업데이트 정책 수립
  - 정기적인 의존성 점검 방법
  - CI/CD에서 버전 검증 방법
- README.md 업데이트
  - 사전 요구사항에 버전 명시
  - 의존성 관리 가이드 링크 추가

---

## 문서 작성 가이드

새로운 이슈와 해결 내용을 추가할 때는 다음 형식을 따르세요:

```markdown
## YYYY-MM-DD

### 이슈: [이슈 제목]

**질문**: [사용자가 질문한 핵심 내용]

**해결**:
- [해결 방법 1]
- [해결 방법 2]
- [추가 설명]
```

---

## 참고

- 이 문서는 개발 과정에서 발생한 주요 이슈와 해결 방법을 기록합니다.
- 시간순으로 정리하여 프로젝트 진행 상황을 파악할 수 있습니다.
- 새로운 이슈가 발생하면 이 문서에 추가해주세요.

