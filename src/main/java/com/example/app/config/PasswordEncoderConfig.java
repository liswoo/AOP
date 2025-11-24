package com.example.app.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * 비밀번호 암호화 설정 클래스
 * 
 * 이 클래스는 비밀번호를 안전하게 암호화하기 위한 PasswordEncoder 빈을 제공합니다.
 * 
 * BCryptPasswordEncoder란?
 * - BCrypt는 단방향 해시 함수로, 비밀번호를 암호화하는 데 사용됩니다.
 * - 같은 비밀번호라도 매번 다른 해시값을 생성합니다 (Salt 자동 생성).
 * - 비밀번호를 복호화할 수 없으며, 검증만 가능합니다.
 * 
 * 사용 예시:
 * - 비밀번호 암호화: encoder.encode("plainPassword") 
 *   → "$2a$10$N9qo8uLOickgx2ZMRZoMye..."
 * - 비밀번호 검증: encoder.matches("plainPassword", hashedPassword)
 *   → true/false
 */
@Configuration
public class PasswordEncoderConfig {

    /**
     * BCryptPasswordEncoder 빈 생성
     * 
     * 이 빈은 UserService에서 주입받아 사용됩니다.
     * 
     * @return BCryptPasswordEncoder 인스턴스
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}

