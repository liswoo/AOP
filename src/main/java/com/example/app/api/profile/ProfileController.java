package com.example.app.api.profile;

import com.example.app.api.profile.dto.*;
import com.example.app.domain.user.Role;
import com.example.app.domain.user.User;
import com.example.app.domain.user.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * 프로필(Profile) 관련 API 컨트롤러
 * 
 * 로그인한 사용자가 자신의 정보를 조회/수정하는 API를 제공합니다.
 * 
 * 권한 설정:
 * - SecurityConfig에서 /api/profile/** 경로는 authenticated()로 설정되어 있어
 *   어떤 ROLE이든 로그인만 되어 있으면 접근 가능합니다.
 * - ADMIN과 USER 모두 이 API를 사용할 수 있습니다.
 * 
 * 주요 기능:
 * - GET /api/profile: 내 정보 조회
 * - PUT /api/profile: 내 정보 수정 (이름, 이메일)
 * - PATCH /api/profile/password: 비밀번호 변경
 * 
 * 향후 개선:
 * - 나중에 프론트에서 /api/profile을 기반으로 "내 정보" 화면을 만들 예정입니다.
 * 
 * @RestController: REST API 컨트롤러로 인식
 * @Slf4j: 로깅을 위한 Lombok 어노테이션
 */
@Slf4j
@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserService userService;

    /**
     * 내 정보 조회
     * 
     * 로그인한 사용자의 프로필 정보를 조회합니다.
     * 
     * 동작 방식:
     * 1. @AuthenticationPrincipal로 현재 로그인한 사용자의 UserDetails를 받습니다.
     * 2. UserDetails에서 username을 추출합니다.
     * 3. UserService.findByUsername()으로 User 엔티티를 조회합니다.
     * 4. User 엔티티를 ProfileResponse DTO로 변환하여 반환합니다.
     * 
     * @param userDetails 현재 로그인한 사용자 정보 (Spring Security가 자동 주입)
     * @return 사용자 프로필 정보
     */
    @GetMapping
    public ResponseEntity<ProfileResponse> getMyProfile(
            @AuthenticationPrincipal UserDetails userDetails) {

        // 토큰이 없거나 인증되지 않은 경우 401 반환
        if (userDetails == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED,
                    "인증되지 않은 사용자입니다. 로그인이 필요합니다.");
        }

        // UserDetails에서 사용자명 추출
        String username = userDetails.getUsername();
        log.info("내 정보 조회 요청 - username: {}", username);

        // 데이터베이스에서 사용자 정보 조회
        User user = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + username));

        // 주요 역할 추출
        String primaryRole = user.getRoles().stream()
                .map(Role::getCode)
                .filter(code -> code.contains("ADMIN"))
                .findFirst()
                .orElse(user.getRoles().stream()
                        .map(Role::getCode)
                        .findFirst()
                        .orElse("ROLE_USER"))
                .replace("ROLE_", "");  // "ROLE_ADMIN" -> "ADMIN"

        // 응답 생성
        ProfileResponse response = ProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .name(user.getName())
                .role(primaryRole)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * 내 정보 수정
     * 
     * 로그인한 사용자의 이름과 이메일을 수정합니다.
     * 
     * 동작 방식:
     * 1. @AuthenticationPrincipal로 현재 로그인한 사용자의 username을 가져옵니다.
     * 2. UserService.updateProfile()을 호출하여 이름과 이메일을 수정합니다.
     * 3. 수정된 사용자 정보를 ProfileResponse DTO로 변환하여 반환합니다.
     * 
     * @param userDetails 현재 로그인한 사용자 정보 (Spring Security가 자동 주입)
     * @param request 수정할 정보 (이름, 이메일)
     * @return 수정된 사용자 프로필 정보
     */
    @PutMapping
    public ResponseEntity<ProfileResponse> updateMyProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ProfileUpdateRequest request) {

        // 토큰이 없거나 인증되지 않은 경우 401 반환
        if (userDetails == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED,
                    "인증되지 않은 사용자입니다. 로그인이 필요합니다.");
        }

        // UserDetails에서 사용자명 추출
        String username = userDetails.getUsername();
        log.info("내 정보 수정 요청 - username: {}, name: {}, email: {}", 
                username, request.getName(), request.getEmail());

        // UserService를 사용하여 프로필 수정
        User user = userService.updateProfile(username, request.getName(), request.getEmail());

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
        ProfileResponse response = ProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .name(user.getName())
                .role(primaryRole)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * 비밀번호 변경
     * 
     * 로그인한 사용자의 비밀번호를 변경합니다.
     * 
     * 동작 방식:
     * 1. @AuthenticationPrincipal로 현재 로그인한 사용자의 username을 가져옵니다.
     * 2. UserService.changePassword()를 호출하여 비밀번호를 변경합니다.
     * 3. changePassword() 내부에서:
     *    - 현재 비밀번호를 PasswordEncoder.matches()로 검증합니다.
     *    - 불일치 시 InvalidCurrentPasswordException을 발생시킵니다.
     *    - 일치하면 새 비밀번호를 BCrypt로 암호화하여 저장합니다.
     * 
     * @param userDetails 현재 로그인한 사용자 정보 (Spring Security가 자동 주입)
     * @param request 비밀번호 변경 요청 (현재 비밀번호, 새 비밀번호)
     * @return 204 No Content (성공 시)
     */
    @PatchMapping("/password")
    public ResponseEntity<Void> changeMyPassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ProfilePasswordChangeRequest request) {

        // 토큰이 없거나 인증되지 않은 경우 401 반환
        if (userDetails == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED,
                    "인증되지 않은 사용자입니다. 로그인이 필요합니다.");
        }

        // UserDetails에서 사용자명 추출
        String username = userDetails.getUsername();
        log.info("비밀번호 변경 요청 - username: {}", username);

        // UserService를 사용하여 비밀번호 변경
        // 내부에서 현재 비밀번호 검증 및 새 비밀번호 암호화를 수행합니다.
        userService.changePassword(username, request.getCurrentPassword(), request.getNewPassword());

        return ResponseEntity.noContent().build();
    }
}

