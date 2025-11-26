package com.example.app.domain.user;

import com.example.app.api.admin.dto.UserCreateRequest;
import com.example.app.api.admin.dto.UserUpdateRequest;
import com.example.app.domain.user.exception.DuplicateUsernameException;
import com.example.app.domain.user.exception.UserNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
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
 * - 비밀번호 암호화 처리
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
    private final PasswordEncoder passwordEncoder;  // BCryptPasswordEncoder 주입

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
     * 이 메서드는 다음 작업을 수행합니다:
     * 1. 사용자명 중복 체크
     * 2. 비밀번호를 BCrypt로 암호화
     * 3. 사용자 정보 저장
     * 
     * 주의: 전달받은 User 엔티티의 password는 평문이어야 하며,
     * 이 메서드에서 자동으로 BCrypt 해시로 변환됩니다.
     * 
     * @param user 생성할 사용자 정보 (password는 평문)
     * @return 저장된 사용자 (password는 BCrypt 해시)
     * @throws IllegalArgumentException 사용자명 또는 이메일이 이미 존재하는 경우
     */
    @Transactional  // 쓰기 작업이므로 읽기 전용 해제
    public User createUser(User user) {
        // 사용자명 중복 체크
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new IllegalArgumentException("이미 존재하는 사용자명입니다: " + user.getUsername());
        }
        
        // 이메일 중복 체크 (이메일이 있는 경우만)
        if (user.getEmail() != null && !user.getEmail().isEmpty()) {
            if (userRepository.existsByEmail(user.getEmail())) {
                throw new IllegalArgumentException("이미 존재하는 이메일입니다: " + user.getEmail());
            }
        }
        
        // 비밀번호를 BCrypt로 암호화
        // 평문 비밀번호를 해시로 변환하여 저장
        String encodedPassword = passwordEncoder.encode(user.getPassword());
        
        // 암호화된 비밀번호로 User 엔티티 생성
        User userToSave = User.builder()
                .username(user.getUsername())
                .password(encodedPassword)  // 암호화된 비밀번호
                .email(user.getEmail())
                .name(user.getName())
                .active(user.getActive() != null ? user.getActive() : true)
                .build();
        
        // 역할이 있다면 추가
        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            user.getRoles().forEach(userToSave::addRole);
        }
        
        return userRepository.save(userToSave);
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

    // ========== 어드민용 사용자 관리 메서드 ==========

    /**
     * 키워드로 사용자 검색 (페이지네이션 지원)
     * 
     * 어드민이 사용자 목록을 조회할 때 사용하는 메서드입니다.
     * username 또는 name에 키워드가 포함된 사용자를 검색합니다.
     * 
     * @param keyword 검색 키워드 (null이거나 빈 문자열이면 전체 조회)
     * @param pageable 페이지네이션 정보 (page, size)
     * @return 사용자 페이지
     */
    public Page<User> searchUsers(String keyword, Pageable pageable) {
        // null이거나 빈 문자열인 경우 빈 문자열로 변환하여 전체 조회
        String searchKeyword = (keyword == null || keyword.trim().isEmpty()) ? null : keyword.trim();
        return userRepository.searchUsers(searchKeyword, pageable);
    }

    /**
     * ID로 사용자 조회 (어드민용)
     * 
     * 사용자를 찾을 수 없으면 UserNotFoundException을 발생시킵니다.
     * 
     * @param id 사용자 ID
     * @return User 엔티티
     * @throws UserNotFoundException 사용자를 찾을 수 없는 경우
     */
    public User getUserById(Long id) {
        return userRepository.findByIdWithRoles(id)
                .orElseThrow(() -> new UserNotFoundException(id));
    }

    /**
     * 사용자 생성 (어드민용)
     * 
     * 어드민이 새 사용자 계정을 생성할 때 사용하는 메서드입니다.
     * 
     * @param request 사용자 생성 요청 DTO
     * @return 생성된 사용자
     * @throws DuplicateUsernameException username 중복 시
     * @throws IllegalArgumentException 이메일 중복 또는 잘못된 역할인 경우
     */
    @Transactional
    public User createUser(UserCreateRequest request) {
        // username 중복 체크
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateUsernameException(request.getUsername(), 
                    "이미 존재하는 사용자명입니다: " + request.getUsername());
        }

        // 이메일 중복 체크
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 존재하는 이메일입니다: " + request.getEmail());
        }

        // 역할 조회
        String roleCode = "ROLE_" + request.getRole();
        Role role = roleRepository.findByCode(roleCode)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 역할입니다: " + request.getRole()));

        // 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // User 엔티티 생성
        User user = User.builder()
                .username(request.getUsername())
                .password(encodedPassword)
                .email(request.getEmail())
                .name(request.getName())
                .active(true)
                .build();

        // 역할 할당
        user.addRole(role);

        return userRepository.save(user);
    }

    /**
     * 사용자 정보 수정 (어드민용)
     * 
     * 어드민이 사용자 정보를 수정할 때 사용하는 메서드입니다.
     * 비밀번호는 이 메서드에서 변경하지 않습니다.
     * 
     * 정책:
     * - 마지막 ADMIN 보호: 시스템에 ADMIN 역할을 가진 활성 사용자가 1명뿐인데,
     *   그 사용자의 역할을 USER로 낮추려고 하면 400 Bad Request를 반환합니다.
     *   이는 시스템에 관리자가 없어지는 것을 방지하기 위한 정책입니다.
     * 
     * @param id 사용자 ID
     * @param request 사용자 수정 요청 DTO
     * @return 수정된 사용자
     * @throws UserNotFoundException 사용자를 찾을 수 없는 경우
     * @throws IllegalArgumentException 이메일 중복, 잘못된 역할, 마지막 ADMIN 보호 위반 시
     */
    @Transactional
    public User updateUser(Long id, UserUpdateRequest request) {
        User user = getUserById(id);

        // 이메일 수정 (제공된 경우만)
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            // 이메일 중복 체크 (다른 사용자가 이미 사용 중인지 확인)
            Optional<User> existingUser = userRepository.findByEmail(request.getEmail());
            if (existingUser.isPresent() && !existingUser.get().getId().equals(id)) {
                throw new IllegalArgumentException("이미 존재하는 이메일입니다: " + request.getEmail());
            }
            user.updateEmail(request.getEmail().trim());
        }

        // 이름 수정 (제공된 경우만)
        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            user.updateName(request.getName().trim());
        }

        // 역할 수정 (제공된 경우만)
        if (request.getRole() != null && !request.getRole().trim().isEmpty()) {
            String roleCode = "ROLE_" + request.getRole();
            Role role = roleRepository.findByCode(roleCode)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 역할입니다: " + request.getRole()));
            
            // 마지막 ADMIN 보호 정책
            // 현재 사용자가 ADMIN 역할을 가지고 있고, 새 역할이 USER인 경우
            boolean isCurrentUserAdmin = user.getRoles().stream()
                    .anyMatch(r -> r.getCode().equals("ROLE_ADMIN"));
            boolean isNewRoleUser = role.getCode().equals("ROLE_USER");
            
            if (isCurrentUserAdmin && isNewRoleUser) {
                // 시스템에 ADMIN 역할을 가진 활성 사용자가 몇 명인지 확인
                long adminCount = userRepository.countActiveAdminUsers();
                
                // 현재 사용자를 제외하고 카운트해야 하므로,
                // 현재 사용자가 활성 상태이고 ADMIN 역할을 가지고 있다면 카운트에 포함됨
                // 따라서 adminCount가 1이면 현재 사용자가 유일한 ADMIN이므로 역할 변경을 막아야 함
                if (adminCount <= 1) {
                    throw new IllegalArgumentException(
                            "마지막 남은 관리자 계정의 역할을 변경할 수 없습니다. " +
                            "시스템에 최소 1명의 관리자가 필요합니다.");
                }
            }
            
            // 기존 역할 제거 후 새 역할 할당
            user.getRoles().clear();
            user.addRole(role);
        }

        // 활성화 상태 수정 (제공된 경우만)
        // 마지막 ADMIN 보호: 마지막 남은 ADMIN을 비활성화하려고 하면 막아야 함
        if (request.getEnabled() != null && !request.getEnabled()) {
            // 현재 사용자가 ADMIN 역할을 가지고 있고, 비활성화하려는 경우
            boolean isCurrentUserAdmin = user.getRoles().stream()
                    .anyMatch(r -> r.getCode().equals("ROLE_ADMIN"));
            
            if (isCurrentUserAdmin) {
                // 시스템에 ADMIN 역할을 가진 활성 사용자가 몇 명인지 확인
                long adminCount = userRepository.countActiveAdminUsers();
                
                // adminCount가 1이면 현재 사용자가 유일한 ADMIN이므로 비활성화를 막아야 함
                if (adminCount <= 1) {
                    throw new IllegalArgumentException(
                            "마지막 남은 관리자 계정을 비활성화할 수 없습니다. " +
                            "시스템에 최소 1명의 활성 관리자가 필요합니다.");
                }
            }
            
            user.updateActive(request.getEnabled());
        } else if (request.getEnabled() != null && request.getEnabled()) {
            // 활성화는 항상 허용
            user.updateActive(request.getEnabled());
        }
        
        return userRepository.save(user);
    }

    /**
     * 사용자 비밀번호 변경 (어드민용)
     * 
     * 어드민이 사용자의 비밀번호를 변경할 때 사용하는 메서드입니다.
     * 
     * @param id 사용자 ID
     * @param rawPassword 평문 비밀번호 (BCrypt로 암호화됨)
     * @throws UserNotFoundException 사용자를 찾을 수 없는 경우
     */
    @Transactional
    public void changePassword(Long id, String rawPassword) {
        User user = getUserById(id);
        
        // 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(rawPassword);
        
        // 비밀번호 업데이트
        user.updatePassword(encodedPassword);
        
        userRepository.save(user);
    }

    /**
     * 사용자 활성/비활성 상태 변경 (어드민용)
     * 
     * 어드민이 사용자의 활성화 상태를 변경할 때 사용하는 메서드입니다.
     * 
     * @param id 사용자 ID
     * @param enabled 활성화 여부
     * @return 변경된 사용자
     * @throws UserNotFoundException 사용자를 찾을 수 없는 경우
     */
    @Transactional
    public User updateStatus(Long id, boolean enabled) {
        User user = getUserById(id);
        
        // 활성화 상태 업데이트
        user.updateActive(enabled);
        
        return userRepository.save(user);
    }

    /**
     * 사용자 삭제 (어드민용)
     * 
     * 어드민이 사용자를 물리적으로 삭제할 때 사용하는 메서드입니다.
     * 
     * 정책:
     * 1. 기본 관리자 계정 보호: id=1이거나 username이 "admin"인 계정은 삭제할 수 없습니다.
     * 2. 자기 자신 삭제 방지: 현재 로그인한 사용자가 자기 자신의 계정을 삭제하려고 하면 허용하지 않습니다.
     * 3. 마지막 ADMIN 보호: 시스템에 ADMIN 역할을 가진 활성 사용자가 1명뿐인데,
     *    그 사용자를 삭제하려고 하면 400 Bad Request를 반환합니다.
     * 
     * @param id 삭제할 사용자 ID
     * @param currentUsername 현재 로그인한 사용자명 (자기 자신 삭제 방지용)
     * @throws UserNotFoundException 사용자를 찾을 수 없는 경우 (404)
     * @throws IllegalArgumentException 기본 관리자 계정 삭제, 자기 자신 삭제, 마지막 ADMIN 삭제 시도 시 (400)
     */
    @Transactional
    public void deleteUser(Long id, String currentUsername) {
        User user = getUserById(id);
        
        // 1. 기본 관리자 계정 보호: id=1이거나 username이 "admin"인 계정은 삭제 불가
        if (user.getId() == 1L || "admin".equals(user.getUsername())) {
            throw new IllegalArgumentException("기본 관리자 계정은 삭제할 수 없습니다.");
        }
        
        // 2. 자기 자신 삭제 방지: 현재 로그인한 사용자가 자기 자신을 삭제하려고 하면 막음
        if (user.getUsername().equals(currentUsername)) {
            throw new IllegalArgumentException("자기 자신은 삭제할 수 없습니다.");
        }
        
        // 3. 마지막 ADMIN 보호: 마지막 남은 ADMIN을 삭제하려고 하면 막음
        boolean isCurrentUserAdmin = user.getRoles().stream()
                .anyMatch(r -> r.getCode().equals("ROLE_ADMIN"));
        
        if (isCurrentUserAdmin) {
            // 시스템에 ADMIN 역할을 가진 활성 사용자가 몇 명인지 확인
            long adminCount = userRepository.countActiveAdminUsers();
            
            // adminCount가 1이면 현재 사용자가 유일한 ADMIN이므로 삭제를 막아야 함
            if (adminCount <= 1) {
                throw new IllegalArgumentException(
                        "마지막 남은 관리자 계정은 삭제할 수 없습니다. " +
                        "시스템에 최소 1명의 관리자가 필요합니다.");
            }
        }
        
        // 모든 검증을 통과하면 사용자 삭제
        userRepository.delete(user);
    }

    // ========== 프로필 관리 메서드 ==========

    /**
     * 내 정보 수정 (프로필용)
     * 
     * 로그인한 사용자가 자신의 이름과 이메일을 수정할 때 사용하는 메서드입니다.
     * 
     * @param username 현재 로그인한 사용자명
     * @param name 수정할 이름
     * @param email 수정할 이메일
     * @return 수정된 사용자
     * @throws UserNotFoundException 사용자를 찾을 수 없는 경우
     * @throws IllegalArgumentException 이메일 중복 시
     */
    @Transactional
    public User updateProfile(String username, String name, String email) {
        // 사용자 조회
        User user = findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("사용자를 찾을 수 없습니다: " + username));

        // 이메일 중복 체크 (다른 사용자가 이미 사용 중인지 확인)
        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent() && !existingUser.get().getId().equals(user.getId())) {
            throw new IllegalArgumentException("이미 존재하는 이메일입니다: " + email);
        }

        // 이름 수정
        if (name != null && !name.trim().isEmpty()) {
            user.updateName(name.trim());
        }

        // 이메일 수정
        if (email != null && !email.trim().isEmpty()) {
            user.updateEmail(email.trim());
        }

        return userRepository.save(user);
    }

    /**
     * 비밀번호 변경 (프로필용)
     * 
     * 로그인한 사용자가 자신의 비밀번호를 변경할 때 사용하는 메서드입니다.
     * 현재 비밀번호를 확인한 후 새 비밀번호로 변경합니다.
     * 
     * @param username 현재 로그인한 사용자명
     * @param currentPassword 현재 비밀번호 (평문)
     * @param newPassword 새 비밀번호 (평문, BCrypt로 암호화됨)
     * @throws UserNotFoundException 사용자를 찾을 수 없는 경우
     * @throws com.example.app.api.profile.exception.InvalidCurrentPasswordException 현재 비밀번호가 일치하지 않는 경우
     */
    @Transactional
    public void changePassword(String username, String currentPassword, String newPassword) {
        // 사용자 조회
        User user = findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("사용자를 찾을 수 없습니다: " + username));

        // 현재 비밀번호 검증
        // PasswordEncoder.matches()를 사용하여 평문 비밀번호와 암호화된 비밀번호를 비교합니다.
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new com.example.app.api.profile.exception.InvalidCurrentPasswordException();
        }

        // 새 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(newPassword);

        // 비밀번호 업데이트
        user.updatePassword(encodedPassword);

        userRepository.save(user);
    }
}

