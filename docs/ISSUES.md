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

