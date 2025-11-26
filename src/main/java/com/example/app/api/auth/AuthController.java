package com.example.app.api.auth;

import com.example.app.api.auth.dto.LoginRequest;
import com.example.app.api.auth.dto.LoginResponse;
import com.example.app.api.auth.dto.UserInfoResponse;
import com.example.app.domain.auth.JwtTokenProvider;
import com.example.app.domain.user.Role;
import com.example.app.domain.user.User;
import com.example.app.domain.user.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 인증(Authentication) 관련 API 컨트롤러
 * 
 * 이 컨트롤러는 사용자 인증과 관련된 엔드포인트를 제공합니다.
 * 
 * 인증(Authentication) vs 인가(Authorization):
 * - 인증(Authentication): "이 사용자가 누구인가?" - 사용자 신원 확인
 *   예: 로그인하여 JWT 토큰을 발급받는 과정
 * - 인가(Authorization): "이 사용자가 무엇을 할 수 있는가?" - 권한 확인
 *   예: ADMIN 권한이 있는 사용자만 특정 API 접근 가능
 * 
 * 요청 흐름:
 * 1. 클라이언트가 로그인 요청 (POST /api/auth/login)
 * 2. AuthenticationManager가 사용자명/비밀번호 검증
 * 3. 검증 성공 시 JWT 토큰 생성 및 반환
 * 4. 클라이언트가 이후 요청에 JWT 토큰을 Authorization 헤더에 포함
 * 5. JwtAuthenticationFilter가 토큰을 검증하고 SecurityContext에 인증 정보 설정
 * 6. Controller에서 @AuthenticationPrincipal로 현재 사용자 정보 접근
 * 
 * @RestController: REST API 컨트롤러로 인식
 * @Slf4j: 로깅을 위한 Lombok 어노테이션
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;

    /**
     * 서버 상태 확인 엔드포인트
     * 
     * 이 엔드포인트는 인증 없이 접근 가능하며,
     * 서버가 정상적으로 동작하는지 확인하는 용도로 사용됩니다.
     * 
     * @return {"status": "OK"}
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        return ResponseEntity.ok(response);
    }

    /**
     * 로그인 엔드포인트
     * 
     * 사용자명과 비밀번호를 받아서 인증하고, JWT 토큰을 발급합니다.
     * 
     * 인증 과정:
     * 1. AuthenticationManager가 사용자명/비밀번호 검증
     * 2. CustomUserDetailsService가 사용자 정보 로드
     * 3. PasswordEncoder가 비밀번호 검증
     * 4. 검증 성공 시 Authentication 객체 생성
     * 5. JwtTokenProvider가 JWT 토큰 생성
     * 
     * @param request 로그인 요청 (username, password)
     * @return JWT 토큰과 사용자 정보
     */
    @PostMapping("/login")
    @Transactional(readOnly = true)  // roles를 로드하기 위해 트랜잭션 필요
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("로그인 요청 수신 - request: {}", request);
        
        if (request == null) {
            log.error("로그인 요청: request가 null입니다. 요청 본문이 전송되지 않았습니다.");
            throw new IllegalArgumentException("요청 본문이 필요합니다. Content-Type을 application/json으로 설정하고 JSON 형식의 데이터를 전송해주세요.");
        }
        
        if (request.getUsername() == null || request.getPassword() == null) {
            log.error("로그인 요청: username 또는 password가 null입니다. username={}, password={}", 
                    request.getUsername(), request.getPassword() != null ? "***" : null);
            throw new IllegalArgumentException("사용자명과 비밀번호는 필수입니다.");
        }
        
        log.info("로그인 시도: username={}", request.getUsername());

        // 1. AuthenticationManager를 사용하여 사용자 인증
        // UsernamePasswordAuthenticationToken은 사용자명과 비밀번호를 담는 인증 객체입니다.
        Authentication authentication;
        try {
            log.debug("AuthenticationManager.authenticate() 호출 시작: username={}", request.getUsername());
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    )
            );
            log.debug("AuthenticationManager.authenticate() 성공: username={}", request.getUsername());
        } catch (Exception e) {
            log.error("인증 실패: username={}, error={}, message={}", 
                    request.getUsername(), e.getClass().getSimpleName(), e.getMessage(), e);
            throw e; // 예외를 그대로 재발생 (AuthExceptionHandler에서 처리)
        }

        // 2. 인증 성공 시 JWT 토큰 생성
        String accessToken = jwtTokenProvider.generateToken(authentication);

        // 3. 사용자 정보 조회
        User user = userService.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 4. 주요 역할 추출 (첫 번째 역할 또는 ADMIN 우선)
        String primaryRole = user.getRoles().stream()
                .map(Role::getCode)
                .filter(code -> code.contains("ADMIN"))
                .findFirst()
                .orElse(user.getRoles().stream()
                        .map(Role::getCode)
                        .findFirst()
                        .orElse("USER"))
                .replace("ROLE_", "");  // "ROLE_ADMIN" -> "ADMIN"

        // 5. 응답 생성
        LoginResponse response = LoginResponse.builder()
                .accessToken(accessToken)
                .user(LoginResponse.UserInfo.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .role(primaryRole)
                        .build())
                .build();

        log.info("로그인 성공: {}", request.getUsername());
        return ResponseEntity.ok(response);
    }

    /**
     * 현재 로그인한 사용자 정보 조회 엔드포인트
     * 
     * 이 엔드포인트는 인증이 필요합니다.
     * JWT 토큰이 유효해야만 접근할 수 있습니다.
     * 
     * @AuthenticationPrincipal:
     * - SecurityContext에 저장된 현재 인증된 사용자 정보를 자동으로 주입받습니다.
     * - JwtAuthenticationFilter에서 설정한 Authentication 객체에서 UserDetails를 추출합니다.
     * - 토큰이 없거나 인증이 안 된 경우 null이 될 수 있습니다.
     * 
     * @param userDetails 현재 로그인한 사용자 정보 (Spring Security가 자동 주입, null 가능)
     * @return 사용자 정보
     * @throws ResponseStatusException 토큰이 없거나 인증되지 않은 경우 401 반환
     */
    @GetMapping("/me")
    @Transactional(readOnly = true)  // roles를 로드하기 위해 트랜잭션 필요
    public ResponseEntity<UserInfoResponse> getCurrentUser(
            @AuthenticationPrincipal UserDetails userDetails) {

        // 토큰이 없거나 인증되지 않은 경우 401 반환
        // SecurityConfig에서 /api/auth/me를 authenticated()로 설정했지만,
        // 방어적 프로그래밍을 위해 null 체크를 추가합니다.
        if (userDetails == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED,
                    "인증되지 않은 사용자입니다. 로그인이 필요합니다.");
        }

        // UserDetails에서 사용자명 추출
        String username = userDetails.getUsername();

        // 데이터베이스에서 사용자 정보 조회
        User user = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 주요 역할 추출
        String primaryRole = user.getRoles().stream()
                .map(Role::getCode)
                .filter(code -> code.contains("ADMIN"))
                .findFirst()
                .orElse(user.getRoles().stream()
                        .map(Role::getCode)
                        .findFirst()
                        .orElse("ROLE_USER"))
                .replace("ROLE_", "");

        // 응답 생성
        UserInfoResponse response = UserInfoResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .name(user.getName())
                .role(primaryRole)
                .build();

        return ResponseEntity.ok(response);
    }
}

