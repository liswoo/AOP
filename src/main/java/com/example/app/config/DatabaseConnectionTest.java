package com.example.app.config;

import com.example.app.domain.user.UserTest;
import com.example.app.domain.user.UserTestRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;

/**
 * 애플리케이션 시작 시 데이터베이스 연결을 테스트하는 컴포넌트
 * 
 * 이 컴포넌트는 애플리케이션이 시작될 때 자동으로 실행되어:
 * 1. 데이터베이스 연결 상태를 확인합니다
 * 2. 데이터베이스 메타데이터를 출력합니다
 * 3. 테스트용 엔티티를 저장하여 JPA가 정상 작동하는지 확인합니다
 * 
 * 개발 환경에서만 활성화되도록 설정되어 있습니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.db.test.enabled", havingValue = "true", matchIfMissing = true)
public class DatabaseConnectionTest {

    private final DataSource dataSource;
    private final UserTestRepository userTestRepository;

    /**
     * 애플리케이션 시작 시 자동으로 실행되는 메서드
     */
    @PostConstruct
    public void testConnection() {
        try {
            log.info("========================================");
            log.info("데이터베이스 연결 테스트 시작");
            log.info("========================================");

            // 1. 데이터소스 연결 테스트
            testDataSourceConnection();

            // 2. JPA를 통한 데이터 저장 테스트
            testJpaConnection();

            log.info("========================================");
            log.info("데이터베이스 연결 테스트 완료 - 정상 작동 중");
            log.info("========================================");

        } catch (Exception e) {
            log.error("========================================");
            log.error("데이터베이스 연결 테스트 실패!");
            log.error("에러 메시지: {}", e.getMessage());
            log.error("========================================");
            log.error("DB 연결 실패 시 확인 순서는 readme.md를 참고하세요.", e);
        }
    }

    /**
     * 데이터소스 연결 테스트
     */
    private void testDataSourceConnection() throws Exception {
        log.info("1. DataSource 연결 테스트 중...");

        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();

            log.info("   ✓ 연결 성공!");
            log.info("   - 데이터베이스 제품: {}", metaData.getDatabaseProductName());
            log.info("   - 데이터베이스 버전: {}", metaData.getDatabaseProductVersion());
            log.info("   - 드라이버 이름: {}", metaData.getDriverName());
            log.info("   - 드라이버 버전: {}", metaData.getDriverVersion());
            log.info("   - URL: {}", metaData.getURL());
            log.info("   - 사용자명: {}", metaData.getUserName());
        }
    }

    /**
     * JPA를 통한 데이터 저장 테스트
     */
    private void testJpaConnection() {
        log.info("2. JPA 연결 및 테이블 생성 테스트 중...");

        // 테스트용 데이터 생성
        UserTest testUser = UserTest.builder()
                .name("테스트 사용자")
                .email("test@example.com")
                .description("PostgreSQL 연결 테스트용 데이터입니다.")
                .active(true)
                .build();

        // 저장
        UserTest savedUser = userTestRepository.save(testUser);
        log.info("   ✓ JPA 저장 성공!");
        Long savedUserId = savedUser.getId();
        log.info("   - 저장된 ID: {}", savedUserId);
        log.info("   - 저장된 이름: {}", savedUser.getName());
        log.info("   - 생성 시간: {}", savedUser.getCreatedAt());

        // 조회
        UserTest foundUser = userTestRepository.findById(savedUserId)
                .orElseThrow(() -> new RuntimeException("저장된 데이터를 찾을 수 없습니다."));
        log.info("   ✓ JPA 조회 성공!");
        log.info("   - 조회된 데이터: {}", foundUser.getName());

        // 삭제 (테스트 데이터 정리)
        userTestRepository.deleteById(savedUserId);
        log.info("   ✓ 테스트 데이터 삭제 완료");
    }
}

