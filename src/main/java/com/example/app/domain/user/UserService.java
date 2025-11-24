package com.example.app.domain.user;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * 사용자(User) 관련 비즈니스 로직을 처리하는 서비스 클래스
 * 
 * 서비스 레이어의 역할:
 * - 비즈니스 로직 구현
 * - 트랜잭션 관리
 * - 여러 리포지토리를 조합하여 복잡한 작업 수행
 * 
 * @Service: Spring이 이 클래스를 서비스 빈으로 등록합니다.
 * @RequiredArgsConstructor: final 필드에 대한 생성자를 자동 생성합니다 (의존성 주입용).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)  // 읽기 전용 트랜잭션 (성능 최적화)
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    /**
     * 모든 사용자 조회
     * 
     * @return 사용자 목록
     */
    public List<User> findAll() {
        return userRepository.findAll();
    }

    /**
     * ID로 사용자 조회
     * 
     * @param id 사용자 ID
     * @return Optional<User>
     */
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    /**
     * 사용자명으로 사용자 조회
     * 
     * @param username 사용자명
     * @return Optional<User>
     */
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    /**
     * 이메일로 사용자 조회
     * 
     * @param email 이메일
     * @return Optional<User>
     */
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * 새 사용자 생성
     * 
     * @param user 생성할 사용자 정보
     * @return 저장된 사용자
     */
    @Transactional  // 쓰기 작업이므로 읽기 전용 해제
    public User create(User user) {
        // 중복 체크
        if (userRepository.existsByUsernameOrEmail(user.getUsername(), user.getEmail())) {
            throw new IllegalArgumentException("이미 존재하는 사용자명 또는 이메일입니다.");
        }
        
        return userRepository.save(user);
    }

    /**
     * 사용자 정보 수정
     * 
     * @param id 사용자 ID
     * @param username 수정할 사용자명 (null이면 변경 안 함)
     * @param email 수정할 이메일 (null이면 변경 안 함)
     * @param name 수정할 이름 (null이면 변경 안 함)
     * @return 수정된 사용자
     */
    @Transactional
    public User update(Long id, String username, String email, String name) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        
        // TODO: User 엔티티에 update 메서드를 추가하여 수정 로직 구현 예정
        // 예: user.update(username, email, name);
        
        return userRepository.save(user);
    }

    /**
     * 사용자 삭제 (소프트 삭제: active를 false로 변경)
     * 
     * @param id 사용자 ID
     */
    @Transactional
    public void delete(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        
        // TODO: 실제 삭제 대신 active = false로 변경하는 메서드 추가 예정
        userRepository.delete(user);
    }
}

