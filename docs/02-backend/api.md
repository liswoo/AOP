# API 엔드포인트

이 문서는 AOP 프로젝트의 REST API 엔드포인트를 설명합니다.

## 기본 정보

- **Base URL**: `http://localhost:8080/api`
- **인증 방식**: JWT (Bearer Token)
- **Content-Type**: `application/json`

## 인증 API (`/api/auth`)

### Health Check
```http
GET /api/auth/health
```

**설명**: 서버 상태 확인 (인증 불필요)

**응답**:
```json
{
  "status": "OK"
}
```

### 로그인
```http
POST /api/auth/login
```

**설명**: 사용자 로그인 및 JWT 토큰 발급

**인증**: 불필요

**요청 본문**:
```json
{
  "username": "admin",
  "password": "admin1234"
}
```

**응답**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "name": "관리자",
    "roles": ["ROLE_ADMIN"]
  }
}
```

**에러 응답** (401 Unauthorized):
```json
{
  "error": "Invalid username or password"
}
```

### 현재 사용자 정보 조회
```http
GET /api/auth/me
```

**설명**: 현재 로그인한 사용자 정보 조회

**인증**: 필요 (Bearer Token)

**요청 헤더**:
```
Authorization: Bearer <accessToken>
```

**응답**:
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "name": "관리자",
  "roles": ["ROLE_ADMIN"],
  "active": true
}
```

## 관리자 API (`/api/admin`)

모든 관리자 API는 **ADMIN 역할**이 필요합니다.

### 사용자 목록 조회
```http
GET /api/admin/users
```

**설명**: 사용자 목록 조회 (페이지네이션 지원)

**인증**: 필요 (ADMIN 역할)

**쿼리 파라미터**:
- `page` (선택): 페이지 번호 (기본값: 0)
- `size` (선택): 페이지 크기 (기본값: 20)

**응답**:
```json
{
  "content": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "name": "관리자",
      "roles": ["ROLE_ADMIN"],
      "active": true,
      "createdAt": "2025-01-01T00:00:00"
    }
  ],
  "totalElements": 100,
  "totalPages": 5,
  "size": 20,
  "number": 0
}
```

### 사용자 상세 조회
```http
GET /api/admin/users/{id}
```

**설명**: 특정 사용자 상세 정보 조회

**인증**: 필요 (ADMIN 역할)

**경로 변수**:
- `id`: 사용자 ID

**응답**:
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "name": "관리자",
  "roles": ["ROLE_ADMIN"],
  "active": true,
  "createdAt": "2025-01-01T00:00:00",
  "updatedAt": "2025-01-01T00:00:00"
}
```

### 사용자 생성
```http
POST /api/admin/users
```

**설명**: 새 사용자 계정 생성

**인증**: 필요 (ADMIN 역할)

**요청 본문**:
```json
{
  "username": "newuser",
  "password": "password123",
  "email": "newuser@example.com",
  "name": "새 사용자",
  "roles": ["ROLE_USER"]
}
```

**응답**:
```json
{
  "id": 101,
  "username": "newuser",
  "email": "newuser@example.com",
  "name": "새 사용자",
  "roles": ["ROLE_USER"],
  "active": true,
  "createdAt": "2025-01-01T00:00:00"
}
```

### 사용자 정보 수정
```http
PUT /api/admin/users/{id}
```

**설명**: 사용자 정보 수정

**인증**: 필요 (ADMIN 역할)

**경로 변수**:
- `id`: 사용자 ID

**요청 본문**:
```json
{
  "email": "updated@example.com",
  "name": "수정된 이름",
  "roles": ["ROLE_USER", "ROLE_ADMIN"]
}
```

**응답**:
```json
{
  "id": 1,
  "username": "admin",
  "email": "updated@example.com",
  "name": "수정된 이름",
  "roles": ["ROLE_USER", "ROLE_ADMIN"],
  "active": true,
  "updatedAt": "2025-01-01T00:00:00"
}
```

### 사용자 활성화/비활성화
```http
PATCH /api/admin/users/{id}/status
```

**설명**: 사용자 계정 활성화/비활성화

**인증**: 필요 (ADMIN 역할)

**경로 변수**:
- `id`: 사용자 ID

**요청 본문**:
```json
{
  "active": false
}
```

**응답**:
```json
{
  "id": 1,
  "username": "admin",
  "active": false,
  "updatedAt": "2025-01-01T00:00:00"
}
```

### 사용자 비밀번호 변경
```http
PATCH /api/admin/users/{id}/password
```

**설명**: 사용자 비밀번호 변경 (관리자용)

**인증**: 필요 (ADMIN 역할)

**경로 변수**:
- `id`: 사용자 ID

**요청 본문**:
```json
{
  "newPassword": "newpassword123"
}
```

**응답**:
```json
{
  "message": "Password updated successfully"
}
```

### 사용자 삭제
```http
DELETE /api/admin/users/{id}
```

**설명**: 사용자 계정 삭제

**인증**: 필요 (ADMIN 역할)

**경로 변수**:
- `id`: 사용자 ID

**응답**: 204 No Content

## 대시보드 API (`/api/dashboard`)

### 대시보드 개요
```http
GET /api/dashboard/overview
```

**설명**: 대시보드 개요 데이터 조회

**인증**: 필요 (모든 인증된 사용자)

**응답**:
```json
{
  "summaryCards": [
    {
      "title": "총 매출",
      "value": 1500000,
      "change": 12.5,
      "trend": "up"
    }
  ],
  "chartData": {
    "labels": ["1월", "2월", "3월"],
    "datasets": [
      {
        "label": "매출",
        "data": [1000000, 1200000, 1500000],
        "backgroundColor": "rgba(54, 162, 235, 0.5)"
      }
    ]
  }
}
```

## 프로필 API (`/api/profile`)

### 프로필 조회
```http
GET /api/profile
```

**설명**: 현재 사용자 프로필 정보 조회

**인증**: 필요

**응답**:
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "name": "관리자",
  "roles": ["ROLE_ADMIN"],
  "active": true,
  "createdAt": "2025-01-01T00:00:00",
  "updatedAt": "2025-01-01T00:00:00"
}
```

### 프로필 수정
```http
PUT /api/profile
```

**설명**: 현재 사용자 프로필 정보 수정

**인증**: 필요

**요청 본문**:
```json
{
  "email": "updated@example.com",
  "name": "수정된 이름"
}
```

**응답**:
```json
{
  "id": 1,
  "username": "admin",
  "email": "updated@example.com",
  "name": "수정된 이름",
  "roles": ["ROLE_ADMIN"],
  "active": true,
  "updatedAt": "2025-01-01T00:00:00"
}
```

### 비밀번호 변경
```http
PATCH /api/profile/password
```

**설명**: 현재 사용자 비밀번호 변경

**인증**: 필요

**요청 본문**:
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

**응답**:
```json
{
  "message": "Password updated successfully"
}
```

**에러 응답** (400 Bad Request):
```json
{
  "error": "Invalid current password"
}
```

## 에러 응답 형식

### 400 Bad Request
```json
{
  "error": "Error message",
  "details": "Additional details"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Access denied"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An error occurred"
}
```

## 관련 문서

- [인증/인가](authentication.md) - JWT 기반 인증 시스템
- [백엔드 개요](overview.md) - 백엔드 프로젝트 구조

