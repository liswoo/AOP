package com.example.app.api.admin;

import com.example.app.api.admin.dto.*;
import com.example.app.domain.user.Role;
import com.example.app.domain.user.User;
import com.example.app.domain.user.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 어드민용 사용자 관리 API 컨트롤러
 * 
 * 이 컨트롤러는 ADMIN 권한이 있는 사용자만 접근할 수 있습니다.
 * SecurityConfig에서 /api/admin/** 경로는 hasRole("ADMIN")으로 설정되어 있습니다.
 * 
 * 주요 기능:
 * - 사용자 목록 조회 (페이지네이션, 검색)
 * - 사용자 상세 조회
 * - 사용자 생성
 * - 사용자 정보 수정
 * - 사용자 비밀번호 변경
 * - 사용자 활성/비활성 상태 변경
 * 
 * 테스트 방법 (Postman 예시):
 * 
 * 1. 로그인하여 토큰 발급:
 *    POST http://localhost:8080/api/auth/login
 *    Body: {
 *      "username": "admin",
 *      "password": "admin1234"
 *    }
 *    → 응답에서 accessToken 복사
 * 
 * 2. 사용자 목록 조회:
 *    GET http://localhost:8080/api/admin/users?page=0&size=20&keyword=admin
 *    Headers: Authorization: Bearer {accessToken}
 * 
 * 3. 사용자 상세 조회:
 *    GET http://localhost:8080/api/admin/users/1
 *    Headers: Authorization: Bearer {accessToken}
 * 
 * 4. 사용자 생성:
 *    POST http://localhost:8080/api/admin/users
 *    Headers: Authorization: Bearer {accessToken}
 *    Body: {
 *      "username": "user01",
 *      "password": "user1234",
 *      "email": "user01@example.com",
 *      "name": "홍길동",
 *      "role": "USER"
 *    }
 * 
 * 5. 사용자 정보 수정:
 *    PUT http://localhost:8080/api/admin/users/1
 *    Headers: Authorization: Bearer {accessToken}
 *    Body: {
 *      "email": "new@example.com",
 *      "name": "새 이름",
 *      "role": "ADMIN",
 *      "enabled": true
 *    }
 * 
 * 6. 비밀번호 변경:
 *    PATCH http://localhost:8080/api/admin/users/1/password
 *    Headers: Authorization: Bearer {accessToken}
 *    Body: {
 *      "newPassword": "newPass1234"
 *    }
 * 
 * 7. 활성/비활성 상태 변경:
 *    PATCH http://localhost:8080/api/admin/users/1/status
 *    Headers: Authorization: Bearer {accessToken}
 *    Body: {
 *      "enabled": false
 *    }
 * 
 * 8. 사용자 삭제:
 *    DELETE http://localhost:8080/api/admin/users/2
 *    Headers: Authorization: Bearer {accessToken}
 *    → 204 No Content (성공 시)
 *    → 400 Bad Request (ADMIN 계정 삭제 시도 시)
 *    → 404 Not Found (존재하지 않는 사용자)
 * 
 * @RestController: REST API 컨트롤러로 인식
 * @Slf4j: 로깅을 위한 Lombok 어노테이션
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;

    /**
     * 사용자 목록 조회 (페이지네이션 및 검색 지원)
     * 
     * 어드민이 사용자 목록을 조회할 때 사용하는 엔드포인트입니다.
     * 
     * @param page 페이지 번호 (0부터 시작, 기본값: 0)
     * @param size 페이지 크기 (기본값: 20)
     * @param keyword 검색 키워드 (username 또는 name에 LIKE 검색, 선택사항)
     * @return 페이지네이션 정보를 포함한 사용자 목록
     */
    @GetMapping
    public ResponseEntity<Page<UserSummaryResponse>> getUsers(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "siez",defaultValue = "20") int size,
            @RequestParam(name = "keyword", required = false) String keyword) {

        log.info("사용자 목록 조회 요청 - page: {}, size: {}, keyword: {}", page, size, keyword);

        Pageable pageable = PageRequest.of(page, size);
        Page<User> userPage = userService.searchUsers(keyword, pageable);

        // User 엔티티를 UserSummaryResponse DTO로 변환
        Page<UserSummaryResponse> response = userPage.map(this::toUserSummaryResponse);

        return ResponseEntity.ok(response);
    }

    /**
     * 단일 사용자 조회
     * 
     * 어드민이 특정 사용자의 상세 정보를 조회할 때 사용하는 엔드포인트입니다.
     * 
     * @param id 사용자 ID
     * @return 사용자 정보
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserSummaryResponse> getUser(@PathVariable("id") Long id) {
        log.info("사용자 상세 조회 요청 - id: {}", id);

        User user = userService.getUserById(id);
        UserSummaryResponse response = toUserSummaryResponse(user);

        return ResponseEntity.ok(response);
    }

    /**
     * 사용자 생성 (어드민에 의한 계정 생성)
     * 
     * 어드민이 새 사용자 계정을 생성할 때 사용하는 엔드포인트입니다.
     * 
     * @param request 사용자 생성 요청 DTO
     * @return 생성된 사용자 정보
     */
    @PostMapping
    public ResponseEntity<UserSummaryResponse> createUser(
            @Valid @RequestBody UserCreateRequest request) {

        log.info("사용자 생성 요청 - username: {}", request.getUsername());

        User user = userService.createUser(request);
        UserSummaryResponse response = toUserSummaryResponse(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 사용자 정보 수정
     * 
     * 어드민이 사용자 정보를 수정할 때 사용하는 엔드포인트입니다.
     * 비밀번호는 이 엔드포인트에서 변경하지 않습니다.
     * 
     * @param id 사용자 ID
     * @param request 사용자 수정 요청 DTO
     * @return 수정된 사용자 정보
     */
    @PutMapping("/{id}")
    public ResponseEntity<UserSummaryResponse> updateUser(
            @PathVariable("id") Long id,
            @Valid @RequestBody UserUpdateRequest request) {

        log.info("사용자 정보 수정 요청 - id: {}", id);

        User user = userService.updateUser(id, request);
        UserSummaryResponse response = toUserSummaryResponse(user);

        return ResponseEntity.ok(response);
    }

    /**
     * 사용자 비밀번호 변경
     * 
     * 어드민이 사용자의 비밀번호를 변경할 때 사용하는 엔드포인트입니다.
     * 
     * @param id 사용자 ID
     * @param request 비밀번호 변경 요청 DTO
     * @return 204 No Content (성공 시)
     */
    @PatchMapping("/{id}/password")
    public ResponseEntity<Void> changePassword(
            @PathVariable("id") Long id,
            @Valid @RequestBody UserPasswordChangeRequest request) {

        log.info("사용자 비밀번호 변경 요청 - id: {}", id);

        userService.changePassword(id, request.getNewPassword());

        return ResponseEntity.noContent().build();
    }

    /**
     * 사용자 활성/비활성 상태 변경
     * 
     * 어드민이 사용자의 활성화 상태를 변경할 때 사용하는 엔드포인트입니다.
     * 
     * 실제 삭제 대신 비활성화용으로 사용할 수 있습니다.
     * 사용자를 완전히 삭제하려면 DELETE /api/admin/users/{id} 엔드포인트를 사용하세요.
     * 
     * @param id 사용자 ID
     * @param request 상태 변경 요청 DTO
     * @return 변경된 사용자 정보
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<UserSummaryResponse> updateStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody UserStatusUpdateRequest request) {

        log.info("사용자 상태 변경 요청 - id: {}, enabled: {}", id, request.getEnabled());

        User user = userService.updateStatus(id, request.getEnabled());
        UserSummaryResponse response = toUserSummaryResponse(user);

        return ResponseEntity.ok(response);
    }

    /**
     * 사용자 삭제
     * 
     * 어드민이 사용자를 물리적으로 삭제할 때 사용하는 엔드포인트입니다.
     * 
     * 주의:
     * - ADMIN 계정(id=1, username="admin")은 삭제할 수 없습니다.
     * - 삭제 시도 시 400 Bad Request를 반환합니다.
     * - 실제 삭제 대신 비활성화를 원한다면 PATCH /api/admin/users/{id}/status를 사용하세요.
     * 
     * @param id 삭제할 사용자 ID
     * @return 204 No Content (성공 시)
     * @throws UserNotFoundException 사용자를 찾을 수 없는 경우 (404)
     * @throws IllegalArgumentException ADMIN 계정 삭제 시도 시 (400)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable("id") Long id) {
        log.info("사용자 삭제 요청 - id: {}", id);

        userService.deleteUser(id);

        return ResponseEntity.noContent().build();
    }

    /**
     * User 엔티티를 UserSummaryResponse DTO로 변환
     * 
     * @param user User 엔티티
     * @return UserSummaryResponse DTO
     */
    private UserSummaryResponse toUserSummaryResponse(User user) {
        // 주요 역할 추출 (ADMIN 우선, 없으면 첫 번째 역할)
        String primaryRole = user.getRoles().stream()
                .map(Role::getCode)
                .filter(code -> code.contains("ADMIN"))
                .findFirst()
                .orElse(user.getRoles().stream()
                        .map(Role::getCode)
                        .findFirst()
                        .orElse("ROLE_USER"))
                .replace("ROLE_", "");  // "ROLE_ADMIN" -> "ADMIN"

        return UserSummaryResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .name(user.getName())
                .role(primaryRole)
                .enabled(user.getActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}


