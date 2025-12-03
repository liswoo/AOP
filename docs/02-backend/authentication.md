# 인증/인가 시스템

이 문서는 AOP 프로젝트의 JWT 기반 인증/인가 시스템을 설명합니다.

## 개요

이 프로젝트는 **JWT (JSON Web Token)** 기반의 Stateless 인증 방식을 사용합니다.

### 주요 특징
- **Stateless**: 서버에 세션을 저장하지 않음
- **JWT 토큰**: 모든 인증 정보를 토큰에 포함
- **역할 기반 접근 제어 (RBAC)**: ADMIN, USER 역할로 권한 관리
- **BCrypt 비밀번호 암호화**: 단방향 해시로 비밀번호 저장

## 인증 플로우

```
┌──────────────┐
│   클라이언트   │
│  (React App) │
└──────┬───────┘
       │
       │ 1. POST /api/auth/login
       │    { username, password }
       ▼
┌─────────────────────────────────────────┐
│         AuthController.login()          │
│  - AuthenticationManager.authenticate() │
│  - CustomUserDetailsService.loadUser()  │
│  - PasswordEncoder.matches()            │
└──────┬──────────────────────────────────┘
       │
       │ 2. 인증 성공
       │
       ▼
┌─────────────────────────────────────────┐
│      JwtTokenProvider.generateToken()   │
│  - 사용자 정보를 JWT 토큰으로 변환        │
│  - secret key로 서명                    │
│  - expiration 시간 설정                 │
└──────┬──────────────────────────────────┘
       │
       │ 3. JWT 토큰 반환
       │    { accessToken, user: {...} }
       ▼
┌──────────────┐
│   클라이언트   │
│ 토큰을 저장   │
└──────┬───────┘
       │
       │ 4. 이후 모든 요청에 포함
       │    Authorization: Bearer <token>
       ▼
┌─────────────────────────────────────────┐
│    JwtAuthenticationFilter              │
│  - 요청 헤더에서 토큰 추출                │
│  - JwtTokenProvider.validateToken()     │
│  - 토큰에서 사용자 정보 추출              │
│  - SecurityContext에 인증 정보 설정      │
└──────┬──────────────────────────────────┘
       │
       │ 5. SecurityContext에 인증 정보 설정됨
       │
       ▼
┌─────────────────────────────────────────┐
│         SecurityConfig                  │
│  - authorizeHttpRequests()              │
│  - /api/admin/** → hasRole("ADMIN")     │
│  - /api/** → authenticated()            │
└──────┬──────────────────────────────────┘
       │
       │ 6. 권한 확인 통과
       │
       ▼
┌─────────────────────────────────────────┐
│      Controller Method                  │
│  @AuthenticationPrincipal UserDetails   │
└─────────────────────────────────────────┘
```

## 주요 컴포넌트

### 1. JwtTokenProvider

**위치**: `src/main/java/com/example/app/domain/auth/JwtTokenProvider.java`

**기능**:
- JWT 토큰 생성 (`generateToken()`)
- JWT 토큰 검증 (`validateToken()`)
- 토큰에서 사용자 정보 추출 (`getUsernameFromToken()`)

**설정**:
- **서명 방식**: HS256
- **만료 시간**: 1시간 (설정 가능, `application.yml`의 `app.jwt.expiration-millis`)
- **Secret Key**: `application.yml`의 `app.jwt.secret`

### 2. JwtAuthenticationFilter

**위치**: `src/main/java/com/example/app/domain/auth/JwtAuthenticationFilter.java`

**기능**:
- 모든 HTTP 요청에서 JWT 토큰 추출
- 토큰 검증 및 사용자 정보 추출
- SecurityContext에 인증 정보 설정

**동작**:
1. 요청 헤더에서 `Authorization: Bearer <token>` 추출
2. 토큰이 있으면 `JwtTokenProvider.validateToken()` 호출
3. 유효한 토큰이면 사용자 정보를 SecurityContext에 설정

### 3. CustomUserDetailsService

**위치**: `src/main/java/com/example/app/domain/auth/CustomUserDetailsService.java`

**기능**:
- Spring Security의 `UserDetailsService` 구현
- 사용자명으로 사용자 정보 조회
- `UserDetails` 객체로 변환하여 반환

### 4. SecurityConfig

**위치**: `src/main/java/com/example/app/config/SecurityConfig.java`

**주요 설정**:

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    // JWT 필터를 UsernamePasswordAuthenticationFilter 앞에 추가
    http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
    
    // 세션 비활성화 (Stateless)
    http.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
    
    // CSRF 비활성화 (JWT 기반이므로 불필요)
    http.csrf(csrf -> csrf.disable());
    
    // 인가 규칙
    http.authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/auth/login", "/api/auth/health").permitAll()
        .requestMatchers("/api/admin/**").hasRole("ADMIN")
        .requestMatchers("/api/**").authenticated()
        .anyRequest().permitAll()
    );
}
```

### 5. PasswordEncoderConfig

**위치**: `src/main/java/com/example/app/config/PasswordEncoderConfig.java`

**기능**:
- BCrypt 비밀번호 인코더 빈 등록
- 비밀번호 암호화 및 검증

## 인가 규칙

### 공개 엔드포인트 (인증 불필요)
- `POST /api/auth/login` - 로그인
- `GET /api/auth/health` - 서버 상태 확인

### 인증 필요 (모든 인증된 사용자)
- `GET /api/auth/me` - 현재 사용자 정보 조회
- `GET /api/dashboard/**` - 대시보드 API
- `GET /api/profile` - 프로필 조회
- `PUT /api/profile` - 프로필 수정
- `PATCH /api/profile/password` - 비밀번호 변경

### 관리자 전용 (ADMIN 역할 필요)
- `GET /api/admin/**` - 모든 관리자 API
- `POST /api/admin/users` - 사용자 생성
- `PUT /api/admin/users/{id}` - 사용자 수정
- `DELETE /api/admin/users/{id}` - 사용자 삭제

## JWT 토큰 구조

### 토큰 생성 시 포함되는 정보
- `sub` (Subject): 사용자명 (username)
- `roles`: 사용자 역할 목록 (예: ["ROLE_ADMIN", "ROLE_USER"])
- `exp` (Expiration): 만료 시간
- `iat` (Issued At): 발급 시간

### 토큰 예시
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInJvbGVzIjpbIlJPTEVfQURNSU4iXSwiaWF0IjoxNzMxMjM0NTY3LCJleHAiOjE3MzEyMzgxNjd9.signature
```

## 보안 주요 사항

### 1. 비밀번호 암호화
- **방식**: BCrypt (단방향 해시)
- **Salt**: BCrypt가 자동 생성
- **라운드**: 기본값 (10)

### 2. JWT 토큰
- **서명 방식**: HS256
- **만료 시간**: 1시간 (설정 가능)
- **토큰 위치**: HTTP Authorization 헤더
- **형식**: `Bearer <token>`

### 3. CORS 설정
- **허용 Origin**: `http://localhost:5173` (React 개발 서버)
- **허용 메서드**: GET, POST, PUT, PATCH, DELETE
- **허용 헤더**: Authorization, Content-Type

### 4. 인가
- **역할 기반 접근 제어 (RBAC)**: ADMIN, USER 역할
- **기본 역할**: 모든 사용자는 USER 역할을 가짐
- **관리자 역할**: ADMIN 역할이 있는 사용자만 관리자 API 접근 가능

## 설정

### application.yml

```yaml
app:
  jwt:
    # JWT 토큰 서명에 사용할 비밀키
    # 주의: 운영 환경에서는 반드시 강력한 랜덤 문자열로 변경하세요!
    secret: your-secret-key-change-this-in-production-minimum-256-bits
    # JWT 토큰 만료 시간 (밀리초)
    # 기본값: 1시간 (3600000ms)
    expiration-millis: 3600000
```

### SecurityConfig.java

```java
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final JwtAccessDeniedHandler jwtAccessDeniedHandler;
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // JWT 필터 추가
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            
            // 세션 비활성화
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            
            // CSRF 비활성화
            .csrf(csrf -> csrf.disable())
            
            // 인가 규칙
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/login", "/api/auth/health").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll()
            )
            
            // 예외 처리
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                .accessDeniedHandler(jwtAccessDeniedHandler)
            );
        
        return http.build();
    }
}
```

## 관련 문서

- [백엔드 개요](overview.md) - 백엔드 프로젝트 구조
- [API 엔드포인트](api.md) - REST API 명세서
- [전체 시스템 아키텍처](../01-architecture/overview.md) - 시스템 전체 구조

