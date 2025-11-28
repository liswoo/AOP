package com.example.app.domain.auth;

import com.example.app.domain.user.User;
import com.example.app.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.stream.Collectors;

/**
 * Spring Security의 UserDetailsService 구현 클래스
 * 
 * UserDetailsService란?
 * - Spring Security에서 사용자 정보를 로드하는 인터페이스입니다.
 * - 사용자명(username)을 기반으로 사용자 정보와 권한을 조회합니다.
 * 
 * 인증(Authentication) 과정:
 * 1. 사용자가 로그인 요청 (username, password)
 * 2. 이 서비스가 username으로 User 엔티티 조회
 * 3. UserDetails 객체로 변환하여 반환
 * 4. Spring Security가 비밀번호를 검증
 * 
 * @Service: Spring이 이 클래스를 서비스 빈으로 등록합니다.
 * @Slf4j: 로깅을 위한 Lombok 어노테이션
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * 사용자명으로 사용자 정보를 조회합니다.
     * 
     * 이 메서드는 Spring Security의 인증 과정에서 자동으로 호출됩니다.
     * 
     * @param username 로그인 아이디
     * @return UserDetails 객체 (사용자 정보와 권한 포함)
     * @throws UsernameNotFoundException 사용자를 찾을 수 없을 때
     */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.debug("사용자 조회 시도: username={}", username);
        
        try {
            // 데이터베이스에서 사용자 조회
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> {
                        log.warn("사용자를 찾을 수 없습니다: username={}", username);
                        return new UsernameNotFoundException(
                                "사용자를 찾을 수 없습니다: " + username);
                    });

            log.debug("사용자 조회 성공: username={}, id={}, active={}", 
                    username, user.getId(), user.getActive());

            // 사용자가 비활성화되어 있으면 예외 발생
            if (!user.getActive()) {
                log.warn("비활성화된 사용자 로그인 시도: username={}", username);
                throw new UsernameNotFoundException("비활성화된 사용자입니다: " + username);
            }

            // UserDetails 객체로 변환하여 반환
            UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                    .username(user.getUsername())
                    .password(user.getPassword())  // 이미 BCrypt로 암호화된 비밀번호
                    .authorities(getAuthorities(user))  // 사용자의 권한 목록
                    .build();
            
            log.debug("UserDetails 생성 완료: username={}, authorities={}", 
                    username, getAuthorities(user));
            
            return userDetails;
        } catch (UsernameNotFoundException e) {
            // 사용자를 찾을 수 없는 경우는 그대로 재발생
            throw e;
        } catch (Exception e) {
            // 데이터베이스 연결 오류 등 기타 예외
            log.error("사용자 조회 중 예외 발생: username={}, error={}", username, e.getMessage(), e);
            throw new UsernameNotFoundException("사용자 조회 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * User 엔티티의 Role 목록을 Spring Security의 GrantedAuthority로 변환합니다.
     * 
     * DB에서 실제로 roles를 불러오는지 확인하기 위해 로깅을 추가했습니다.
     * 
     * @param user User 엔티티
     * @return 권한 목록
     */
    private Collection<? extends GrantedAuthority> getAuthorities(User user) {
        log.debug("getAuthorities 호출: username={}, roles 크기={}", 
                user.getUsername(), user.getRoles() != null ? user.getRoles().size() : 0);
        
        Collection<? extends GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> {
                    log.debug("Role 변환: code={}", role.getCode());
                    return role.getCode();  // Role의 code를 가져옴 (예: "ROLE_ADMIN")
                })
                .map(SimpleGrantedAuthority::new)  // GrantedAuthority로 변환
                .collect(Collectors.toList());
        
        log.debug("최종 권한 목록: {}", authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(", ")));
        
        return authorities;
    }
}




