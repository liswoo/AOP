package com.example.app.domain.auth;

import com.example.app.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.stream.Collectors;

/**
 * JWT 토큰 생성 및 검증을 담당하는 유틸리티 클래스
 * 
 * JWT (JSON Web Token)란?
 * - 사용자 인증 정보를 안전하게 전달하기 위한 토큰 기반 인증 방식입니다.
 * - 토큰은 Header, Payload, Signature 세 부분으로 구성됩니다.
 * - 서버에서 비밀키로 서명하여 위변조를 방지합니다.
 * 
 * 주요 기능:
 * 1. 토큰 생성: 사용자 정보를 담아 JWT 토큰 생성
 * 2. 토큰 파싱: JWT 토큰에서 사용자 정보 추출
 * 3. 토큰 검증: 토큰의 유효성(만료, 서명 등) 확인
 * 
 * @Component: Spring이 이 클래스를 빈으로 등록하여 다른 클래스에서 주입받을 수 있게 합니다.
 * @Slf4j: 로깅을 위한 Lombok 어노테이션
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    private final JwtProperties jwtProperties;
    
    /**
     * JWT 서명에 사용할 SecretKey
     * 매번 생성하지 않고 한 번만 생성하여 재사용합니다.
     */
    private SecretKey getSecretKey() {
        return Keys.hmacShaKeyFor(
                jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    /**
     * JWT 토큰을 생성합니다.
     * 
     * 토큰에 포함되는 정보:
     * - subject: 사용자명 (username)
     * - claims: 사용자 ID, 권한 정보 등
     * - expiration: 만료 시간
     * - signature: 비밀키로 서명
     * 
     * @param authentication Spring Security의 인증 객체
     * @return 생성된 JWT 토큰 문자열
     */
    public String generateToken(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String username = userDetails.getUsername();
        
        // 사용자의 권한 목록을 문자열로 변환 (예: "ROLE_ADMIN,ROLE_USER")
        String authorities = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));
        
        // 현재 시간
        Date now = new Date();
        // 만료 시간 (현재 시간 + 설정된 만료 시간)
        Date expiryDate = new Date(now.getTime() + jwtProperties.getExpirationMillis());
        
        // JWT 토큰 생성
        // jjwt 0.12.3 버전 문법 사용
        return Jwts.builder()
                .subject(username)  // 사용자명을 subject로 설정
                .claim("authorities", authorities)  // 권한 정보를 claim에 추가
                .issuedAt(now)  // 토큰 발급 시간
                .expiration(expiryDate)  // 토큰 만료 시간
                .signWith(getSecretKey())  // 비밀키로 서명 (HS256 알고리즘 자동 사용)
                .compact();  // 최종 토큰 문자열 생성
    }

    /**
     * JWT 토큰에서 사용자명(username)을 추출합니다.
     * 
     * @param token JWT 토큰 문자열
     * @return 사용자명
     */
    public String getUsernameFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims.getSubject();  // subject에 저장된 사용자명 반환
    }

    /**
     * JWT 토큰에서 권한 정보를 추출합니다.
     * 
     * @param token JWT 토큰 문자열
     * @return 권한 정보 (예: "ROLE_ADMIN,ROLE_USER")
     */
    public String getAuthoritiesFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims.get("authorities", String.class);
    }

    /**
     * JWT 토큰의 유효성을 검증합니다.
     * 
     * 검증 항목:
     * 1. 토큰 서명이 올바른지 확인
     * 2. 토큰이 만료되지 않았는지 확인
     * 
     * jjwt 0.12.3 버전에서는 parseSignedClaims()가 자동으로 만료 시간도 검증합니다.
     * 
     * @param token JWT 토큰 문자열
     * @return 유효하면 true
     * @throws ExpiredJwtException 토큰이 만료된 경우
     * @throws JwtException 토큰이 잘못된 경우 (서명 오류, 형식 오류 등)
     */
    public boolean validateToken(String token) throws JwtException {
        // jjwt 0.12.3 버전 문법 사용
        // parseSignedClaims()가 서명 검증과 만료 시간 검증을 모두 수행합니다.
        // 예외가 발생하면 호출한 쪽에서 예외 타입을 구분하여 처리할 수 있습니다.
        Jwts.parser()
                .verifyWith(getSecretKey())  // 서명 검증에 사용할 키
                .build()
                .parseSignedClaims(token);  // 서명된 JWT 파싱 (만료 시간도 자동 검증)
        
        return true;
    }

    /**
     * JWT 토큰에서 Claims(클레임)를 추출합니다.
     * 
     * Claims란?
     * - JWT 토큰의 Payload 부분에 담긴 정보입니다.
     * - 사용자명, 권한, 발급 시간, 만료 시간 등의 정보가 포함됩니다.
     * 
     * jjwt 0.12.3 버전 문법:
     * - parserBuilder() 대신 parser() 사용
     * - setSigningKey() 대신 verifyWith() 사용
     * - parseClaimsJws() 대신 parseSignedClaims() 사용
     * - getBody() 대신 getPayload() 사용
     * 
     * @param token JWT 토큰 문자열
     * @return Claims 객체
     * @throws JwtException 토큰 파싱 실패 시
     */
    private Claims getClaimsFromToken(String token) {
        // jjwt 0.12.3 버전 문법 사용
        return Jwts.parser()              // parserBuilder() 대신 parser() 사용
                .verifyWith(getSecretKey())  // setSigningKey() 대신 verifyWith() 사용
                .build()                     // JwtParser 생성
                .parseSignedClaims(token)   // parseClaimsJws() 대신 parseSignedClaims() 사용
                .getPayload();              // getBody() 대신 getPayload() 사용
    }
}

