package com.example.app.domain.user;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 애플리케이션 시작 시 초기 데이터를 생성하는 컴포넌트
 * 
 * 이 클래스는 CommandLineRunner를 구현하여
 * Spring Boot 애플리케이션이 시작될 때 자동으로 실행됩니다.
 * 
 * 주요 기능:
 * - 기본 역할(ADMIN, USER) 생성
 * - 초기 관리자 계정 생성 (없는 경우에만)
 * 
 * 실행 시점:
 * - 애플리케이션이 완전히 시작된 후
 * - 모든 빈이 준비된 상태에서 실행
 * 
 * @Component: Spring이 이 클래스를 컴포넌트로 인식하여 빈으로 등록합니다.
 * @Slf4j: 로깅을 위한 Lombok 어노테이션 (log 변수 자동 생성)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserService userService;
    private final RoleRepository roleRepository;

    /**
     * 애플리케이션 시작 시 실행되는 메서드
     * 
     * 실행 순서:
     * 1. 기본 역할(ADMIN, USER) 생성 또는 확인
     * 2. 초기 관리자 계정 생성 (없는 경우에만)
     * 
     * @param args 명령줄 인수 (사용하지 않음)
     */
    @Override
    @Transactional
    public void run(String... args) {
        log.info("초기 데이터 생성을 시작합니다...");

        // 1. 기본 역할 생성
        createDefaultRoles();

        // 2. 초기 관리자 계정 생성
        createAdminUser();

        // 3. 테스트용 일반 사용자 100명 생성 (개발/테스트 환경용)
        createTestUsers();

        log.info("초기 데이터 생성이 완료되었습니다.");
    }

    /**
     * 기본 역할(ADMIN, USER)을 생성합니다.
     * 
     * 역할이 이미 존재하면 생성하지 않고,
     * 없으면 새로 생성합니다.
     */
    private void createDefaultRoles() {
        log.info("기본 역할을 확인하고 생성합니다...");

        // ADMIN 역할 생성 또는 확인
        if (!roleRepository.existsByCode(RoleType.ADMIN.getCode())) {
            Role adminRole = Role.builder()
                    .code(RoleType.ADMIN.getCode())
                    .name(RoleType.ADMIN.getName())
                    .description("시스템 관리자 권한")
                    .active(true)
                    .build();
            roleRepository.save(adminRole);
            log.info("ADMIN 역할이 생성되었습니다: {}", RoleType.ADMIN.getCode());
        } else {
            log.info("ADMIN 역할이 이미 존재합니다: {}", RoleType.ADMIN.getCode());
        }

        // USER 역할 생성 또는 확인
        if (!roleRepository.existsByCode(RoleType.USER.getCode())) {
            Role userRole = Role.builder()
                    .code(RoleType.USER.getCode())
                    .name(RoleType.USER.getName())
                    .description("일반 사용자 권한")
                    .active(true)
                    .build();
            roleRepository.save(userRole);
            log.info("USER 역할이 생성되었습니다: {}", RoleType.USER.getCode());
        } else {
            log.info("USER 역할이 이미 존재합니다: {}", RoleType.USER.getCode());
        }
    }

    /**
     * 초기 관리자 계정을 생성합니다.
     * 
     * 관리자 계정 정보:
     * - username: "admin"
     * - password: "admin1234" (BCrypt로 암호화됨)
     * - role: ADMIN
     * 
     * 이미 "admin" 사용자가 존재하면 생성하지 않습니다.
     */
    private void createAdminUser() {
        log.info("초기 관리자 계정을 확인하고 생성합니다...");

        // "admin" 사용자가 이미 존재하는지 확인
        if (userService.findByUsername("admin").isPresent()) {
            log.info("관리자 계정이 이미 존재합니다. 초기 계정 생성을 건너뜁니다.");
            return;
        }

        // ADMIN 역할 조회
        Role adminRole = roleRepository.findByCode(RoleType.ADMIN.getCode())
                .orElseThrow(() -> new IllegalStateException(
                        "ADMIN 역할이 존재하지 않습니다. 역할을 먼저 생성해야 합니다."));

        // 관리자 계정 생성
        User adminUser = User.builder()
                .username("admin")
                .password("admin1234")  // 평문 비밀번호 (UserService에서 BCrypt로 암호화됨)
                .email("admin@example.com")
                .name("관리자")
                .active(true)
                .build();

        // ADMIN 역할 할당
        adminUser.addRole(adminRole);

        // 사용자 저장 (비밀번호는 UserService.createUser()에서 자동으로 BCrypt로 암호화됨)
        userService.createUser(adminUser);

        log.info("초기 관리자 계정이 생성되었습니다.");
        log.info("  - 사용자명: admin");
        log.info("  - 비밀번호: admin1234");
        log.info("  - 역할: ADMIN");
        log.warn("⚠️  운영 환경에서는 반드시 초기 비밀번호를 변경하세요!");
    }

    /**
     * 테스트용 일반 사용자 100명 생성
     * 
     * 개발/테스트 환경에서 사용할 목적으로 일반 사용자 100명을 생성합니다.
     * 
     * 생성 규칙:
     * - username: user01, user02, ..., user100
     * - password: password1234 (모두 동일)
     * - name: 사용자01, 사용자02, ..., 사용자100
     * - email: user01@example.com, user02@example.com, ..., user100@example.com
     * - role: USER
     * - enabled: true
     * 
     * 이미 존재하는 사용자는 건너뜁니다.
     */
    private void createTestUsers() {
        log.info("테스트용 일반 사용자 100명 생성을 시작합니다...");

        int createdCount = 0;
        int skippedCount = 0;

        // 1부터 100까지 반복
        for (int i = 1; i <= 100; i++) {
            String username = String.format("user%02d", i); // user01, user02, ..., user100
            String email = String.format("user%02d@example.com", i);
            String name = String.format("사용자%02d", i);

            // 이미 존재하는 사용자인지 확인
            if (userService.findByUsername(username).isPresent()) {
                skippedCount++;
                continue; // 이미 존재하면 건너뜀
            }

            try {
                // UserCreateRequest 생성
                com.example.app.api.admin.dto.UserCreateRequest request = 
                        new com.example.app.api.admin.dto.UserCreateRequest();
                request.setUsername(username);
                request.setPassword("password1234"); // 모든 사용자 동일한 비밀번호
                request.setEmail(email);
                request.setName(name);
                request.setRole("USER");

                // 사용자 생성
                userService.createUser(request);
                createdCount++;

                // 10명마다 로그 출력 (너무 많은 로그 방지)
                if (i % 10 == 0) {
                    log.info("테스트 사용자 생성 진행 중... {}/100", i);
                }
            } catch (Exception e) {
                log.warn("테스트 사용자 생성 실패 - username: {}, error: {}", username, e.getMessage());
            }
        }

        log.info("테스트용 일반 사용자 생성 완료: 생성 {}명, 건너뜀 {}명", createdCount, skippedCount);
        if (createdCount > 0) {
            log.info("테스트 사용자 로그인 정보:");
            log.info("  - 사용자명: user01 ~ user100");
            log.info("  - 비밀번호: password1234 (모두 동일)");
            log.info("  - 역할: USER");
        }
    }
}

