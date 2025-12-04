# 의존성 관리 및 버전 호환성

이 문서는 프로젝트의 의존성 관리 방법과 버전 호환성 대비 방안을 설명합니다.

## 📋 현재 상태

### 백엔드 의존성 관리

**Gradle Wrapper 사용**
- `gradle/wrapper/gradle-wrapper.properties`에 Gradle 버전 명시
- 현재 버전: **Gradle 8.5**
- 이 파일을 Git에 커밋하여 모든 개발자가 동일한 Gradle 버전 사용

**Java 버전**
- `build.gradle`에 명시: **Java 17**
- `sourceCompatibility = '17'`

**Spring Boot 버전**
- `build.gradle`에 명시: **Spring Boot 3.2.0**
- 모든 의존성 버전이 명시적으로 지정됨

### 프론트엔드 의존성 관리

**package-lock.json 사용**
- `package-lock.json`이 Git에 커밋되어 있음
- 이 파일로 모든 개발자가 동일한 의존성 버전 사용 보장

**package.json 버전 정책**
- 현재 `^` (캐럿) 사용: 마이너 버전 업데이트 허용
  - 예: `"react": "^19.2.0"` → 19.2.0 이상 20.0.0 미만 허용
- `package-lock.json`이 실제 설치 버전을 고정

## ⚠️ 버전 호환성 문제 가능성

### 1. Java 버전 변경 시

**문제 가능성**: 높음
- Spring Boot 3.2.0은 Java 17 이상 필요
- Java 21로 업그레이드 시 대부분 호환되지만, 일부 라이브러리에서 문제 발생 가능
- Java 11 이하로 다운그레이드 시 Spring Boot 3.x 사용 불가

**영향받는 부분**:
- Spring Boot 애플리케이션
- JWT 라이브러리 (jjwt)
- Lombok

### 2. Gradle 버전 변경 시

**문제 가능성**: 중간
- Gradle 8.5는 Java 17과 호환
- Gradle 9.x로 업그레이드 시 일부 플러그인 호환성 문제 가능
- Gradle 7.x 이하로 다운그레이드 시 Spring Boot 3.2.0 사용 불가

**영향받는 부분**:
- 빌드 프로세스
- Spring Boot Gradle Plugin
- 의존성 해결

### 3. Node.js 버전 변경 시

**문제 가능성**: 중간
- React 19는 Node.js 18 이상 필요
- Node.js 22로 업그레이드 시 대부분 호환되지만, 일부 패키지에서 문제 발생 가능
- Node.js 16 이하로 다운그레이드 시 React 19 사용 불가

**영향받는 부분**:
- React 애플리케이션
- Vite 빌드 도구
- 모든 npm 패키지

### 4. 의존성 라이브러리 버전 변경 시

**문제 가능성**: 낮음 (package-lock.json으로 보호됨)
- `package-lock.json`이 실제 설치 버전을 고정
- `npm install` 시 항상 동일한 버전 설치
- 단, `npm update` 또는 `npm install <package>@latest` 실행 시 버전 변경 가능

## 🛡️ 대비 방안

### 1. 버전 고정 파일 관리 (현재 적용됨)

#### ✅ 이미 적용된 것들

**백엔드**
- `gradle/wrapper/gradle-wrapper.properties` - Gradle 버전 고정
- `build.gradle` - Java 버전 및 의존성 버전 명시
- 이 파일들을 Git에 커밋하여 버전 관리

**프론트엔드**
- `package-lock.json` - npm 의존성 버전 고정
- 이 파일을 Git에 커밋하여 버전 관리

#### 📝 추가 권장 사항

**Node.js 버전 고정**

`.nvmrc` 파일은 Node Version Manager (nvm)에서 사용하는 설정 파일입니다.

**역할**:
- 프로젝트별로 필요한 Node.js 버전을 명시
- `nvm use` 명령어로 자동으로 해당 버전 활성화
- 팀원들이 동일한 Node.js 버전 사용 보장

**파일 생성**:
```bash
# frontend/.nvmrc 파일 생성 (이미 생성됨)
echo "18" > frontend/.nvmrc
```

**사용 방법**:
```bash
# 1. nvm 설치 (아직 설치하지 않은 경우)
# Windows: https://github.com/coreybutler/nvm-windows
# Mac/Linux: https://github.com/nvm-sh/nvm

# 2. 프로젝트 디렉토리로 이동
cd frontend

# 3. .nvmrc 파일에 명시된 버전 사용
nvm use

# 출력 예시:
# Found 'frontend/.nvmrc' with version <18>
# Now using node v18.20.0
```

**자동화 (선택사항)**:
셸 설정 파일에 다음을 추가하면 프로젝트 디렉토리 진입 시 자동으로 버전 전환:
```bash
# ~/.zshrc 또는 ~/.bashrc에 추가
autoload -U add-zsh-hook
load-nvmrc() {
  local node_version="$(nvm version)"
  local nvmrc_path="$(nvm_find_nvmrc)"

  if [ -n "$nvmrc_path" ]; then
    local nvmrc_node_version=$(nvm version "$(cat "${nvmrc_path}")")

    if [ "$nvmrc_node_version" = "N/A" ]; then
      nvm install
    elif [ "$nvmrc_node_version" != "$node_version" ]; then
      nvm use
    fi
  elif [ "$node_version" != "$(nvm version default)" ]; then
    echo "Reverting to nvm default version"
    nvm use default
  fi
}
add-zsh-hook chpwd load-nvmrc
load-nvmrc
```

**다른 버전 관리 도구**:
- **nodenv**: `.node-version` 파일 사용
- **asdf**: `.tool-versions` 파일 사용
- **Volta**: `package.json`의 `volta` 필드 사용

### 2. 요구사항 문서화

**README.md에 명시**
- Java 17 이상
- Node.js 18 이상 (`.nvmrc` 파일로 고정)
- Gradle 8.5 (Wrapper 사용 시 자동)
- PostgreSQL (선택사항)

**Node.js 버전 관리**
- `.nvmrc` 파일 사용: 자세한 내용은 [Node.js 버전 관리 가이드](node-version-management.md) 참고
- `nvm use` 명령어로 자동 버전 전환

**버전 확인 스크립트 추가 (선택사항)**
```bash
# check-versions.sh
#!/bin/bash
echo "Java 버전:"
java -version

echo "Node.js 버전:"
node -v

echo "npm 버전:"
npm -v

echo "Gradle 버전:"
./gradlew --version
```

### 3. 의존성 업데이트 정책

#### 안전한 업데이트 방법

**프론트엔드 (npm)**
```bash
# 1. 현재 버전 확인
npm outdated

# 2. 패치 버전만 업데이트 (안전)
npm update

# 3. 특정 패키지만 업데이트 (주의)
npm install <package>@<version>

# 4. package-lock.json 업데이트 후 커밋 필수
git add package-lock.json
git commit -m "chore: update dependencies"
```

**백엔드 (Gradle)**
```bash
# 1. 의존성 업데이트 확인
./gradlew dependencyUpdates

# 2. build.gradle에서 버전 수동 업데이트
# 3. 테스트 실행
./gradlew test

# 4. 변경사항 커밋
git add build.gradle
git commit -m "chore: update Spring Boot to 3.2.1"
```

#### 위험한 업데이트 (주의 필요)

**메이저 버전 업데이트**
- React 19 → React 20
- Spring Boot 3.2.0 → Spring Boot 4.0.0
- Java 17 → Java 21

**권장 절차**:
1. 별도 브랜치에서 테스트
2. 모든 테스트 통과 확인
3. 코드 변경사항 검토
4. 문서 업데이트
5. 메인 브랜치에 병합

### 4. CI/CD에서 버전 검증

**GitHub Actions 예시 (선택사항)**
```yaml
# .github/workflows/check-versions.yml
name: Check Versions

on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Verify Java version
        run: java -version
        
      - name: Verify Node.js version
        run: node -v
```

### 5. 의존성 버전 명시적 고정 (선택사항)

**프론트엔드: package.json 수정**
```json
{
  "dependencies": {
    // ^ 제거하여 정확한 버전 고정
    "react": "19.2.0",  // ^19.2.0 → 19.2.0
    "react-dom": "19.2.0"
  }
}
```

**장점**: 버전이 절대 변경되지 않음  
**단점**: 보안 패치를 수동으로 업데이트해야 함

**권장**: 현재 상태 유지 (package-lock.json으로 충분)

### 6. 정기적인 의존성 점검

**월 1회 권장**
1. 보안 취약점 확인
   ```bash
   npm audit
   ./gradlew dependencyCheckAnalyze  # OWASP Dependency-Check 플러그인 필요
   ```

2. 오래된 의존성 확인
   ```bash
   npm outdated
   ./gradlew dependencyUpdates
   ```

3. 업데이트 계획 수립
   - 보안 패치: 즉시 적용
   - 마이너 업데이트: 테스트 후 적용
   - 메이저 업데이트: 별도 계획 수립

## 📊 현재 프로젝트 버전 요약

### 백엔드
- **Java**: 17
- **Gradle**: 8.5 (Wrapper)
- **Spring Boot**: 3.2.0
- **Spring Security**: 3.2.0 (Spring Boot에 포함)
- **JWT (jjwt)**: 0.12.3
- **PostgreSQL**: 런타임 의존성 (버전 명시 안 됨)
- **H2**: 런타임 의존성 (버전 명시 안 됨)

### 프론트엔드
- **Node.js**: 18 이상 권장
- **React**: ^19.2.0
- **TypeScript**: ~5.9.3
- **Vite**: ^7.2.4
- **Handsontable**: ^16.2.0
- **ExcelJS**: ^4.4.0
- **Chart.js**: ^4.5.1

## 🔍 버전 호환성 체크리스트

새로운 환경에서 프로젝트를 실행하기 전에 확인:

- [ ] Java 17 이상 설치 확인
- [ ] Node.js 18 이상 설치 확인
- [ ] Gradle Wrapper 파일 존재 확인 (`gradle/wrapper/`)
- [ ] `package-lock.json` 파일 존재 확인
- [ ] `build.gradle`에 Java 버전 명시 확인
- [ ] README.md의 요구사항 확인

## 📚 관련 문서

- [프론트엔드 개요](../03-frontend/overview.md) - 프론트엔드 기술 스택
- [백엔드 개요](../02-backend/overview.md) - 백엔드 기술 스택
- [데이터베이스 설정](database-setup.md) - 데이터베이스 버전 요구사항

## 💡 결론

**현재 프로젝트는 이미 좋은 의존성 관리 상태입니다:**

1. ✅ `package-lock.json`으로 npm 의존성 고정
2. ✅ `gradle-wrapper.properties`로 Gradle 버전 고정
3. ✅ `build.gradle`에 Java 버전 명시
4. ✅ 모든 버전 관리 파일이 Git에 커밋됨

**추가 권장 사항:**

1. `.nvmrc` 파일 추가 (Node.js 버전 고정)
2. 정기적인 의존성 점검 (월 1회)
3. 보안 취약점 모니터링
4. 의존성 업데이트 시 테스트 철저히 수행

**버전 호환성 문제 발생 시:**

1. `package-lock.json` 또는 `gradle-wrapper.properties` 확인
2. 요구사항 문서 확인
3. 이슈 발생 시 `docs/ISSUES.md`에 기록
4. 필요 시 의존성 버전 롤백

