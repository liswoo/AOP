package com.example.app.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

/**
 * JWT 설정값을 주입받는 Properties 클래스
 * 
 * application.yml의 app.jwt.* 설정값을 자동으로 주입받습니다.
 * 
 * 사용 예시:
 * - secret: JWT 토큰 서명에 사용할 비밀키
 * - expirationMillis: JWT 토큰 만료 시간 (밀리초)
 * 
 * @ConfigurationProperties: application.yml의 app.jwt.* 설정을 자동으로 매핑
 */
@Component
@ConfigurationProperties(prefix = "app.jwt")
@Getter
@Setter
public class JwtProperties {
    
    /**
     * JWT 토큰 서명에 사용할 비밀키
     * 
     * 주의: 운영 환경에서는 반드시 강력한 랜덤 문자열로 변경해야 합니다!
     * 최소 256비트(32바이트) 이상의 랜덤 문자열을 사용하는 것을 권장합니다.
     */
    private String secret;
    
    /**
     * JWT 토큰 만료 시간 (밀리초)
     * 
     * 기본값: 3600000 (1시간)
     * 토큰이 이 시간 이후에는 만료되어 사용할 수 없습니다.
     */
    private Long expirationMillis = 3600000L;
}








