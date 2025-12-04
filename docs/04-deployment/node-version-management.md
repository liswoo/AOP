# Node.js 버전 관리 가이드

이 문서는 프로젝트에서 Node.js 버전을 관리하는 방법을 설명합니다.

## 📋 .nvmrc 파일이란?

`.nvmrc` 파일은 **Node Version Manager (nvm)**에서 사용하는 설정 파일입니다. 프로젝트별로 필요한 Node.js 버전을 명시하여 일관된 개발 환경을 유지합니다.

### 파일 위치
- 현재 프로젝트: `frontend/.nvmrc`
- 내용: `18` (Node.js 18 버전 사용)

## 🎯 왜 필요한가?

### 문제 상황

**버전 불일치로 인한 문제들:**

1. **로컬 환경 차이**
   - 개발자 A: Node.js 20 사용 → 정상 작동
   - 개발자 B: Node.js 16 사용 → 빌드 실패
   - 개발자 C: Node.js 22 사용 → 일부 패키지 호환성 문제

2. **CI/CD 환경 차이**
   - 로컬: Node.js 20
   - CI 서버: Node.js 18
   - 프로덕션: Node.js 16
   - → 환경마다 다른 동작

3. **패키지 호환성 문제**
   - React 19는 Node.js 18 이상 필요
   - Node.js 16에서는 설치 실패
   - Node.js 22에서는 일부 패키지에서 경고 발생

### 해결 방법

`.nvmrc` 파일을 사용하면:
- ✅ 모든 개발자가 동일한 Node.js 버전 사용
- ✅ CI/CD 환경과 로컬 환경 일치
- ✅ 버전 차이로 인한 문제 방지

## 🛠️ 사용 방법

### 1. nvm 설치

**Windows:**
```powershell
# nvm-windows 설치
# https://github.com/coreybutler/nvm-windows/releases
# nvm-setup.exe 다운로드 및 실행
```

**Mac/Linux:**
```bash
# nvm 설치
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 또는
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 설치 후 셸 재시작 또는
source ~/.bashrc  # 또는 ~/.zshrc
```

### 2. .nvmrc 파일 확인

```bash
# frontend 디렉토리로 이동
cd frontend

# .nvmrc 파일 내용 확인
cat .nvmrc
# 출력: 18
```

### 3. Node.js 버전 사용

```bash
# .nvmrc 파일에 명시된 버전 사용
nvm use

# 출력 예시:
# Found 'frontend/.nvmrc' with version <18>
# Now using node v18.20.0 (npm v10.2.4)
```

**만약 해당 버전이 설치되어 있지 않다면:**
```bash
nvm use
# 출력: N/A: version "18" is not yet installed.
# 해결: nvm install 18
```

### 4. Node.js 버전 설치

```bash
# 특정 버전 설치
nvm install 18

# 또는 .nvmrc 파일 기반으로 설치
nvm install

# 최신 LTS 버전 설치
nvm install --lts
```

### 5. 현재 사용 중인 버전 확인

```bash
# 현재 활성화된 Node.js 버전
node -v

# nvm으로 관리되는 모든 버전 목록
nvm list

# 설치 가능한 버전 목록
nvm list-remote
```

## 🔄 자동화 설정

### 셸 자동화 (Mac/Linux)

프로젝트 디렉토리로 이동할 때마다 자동으로 `.nvmrc` 파일을 읽어 Node.js 버전을 전환하도록 설정할 수 있습니다.

**~/.zshrc 또는 ~/.bashrc에 추가:**

```bash
# nvm 자동 전환 함수
autoload -U add-zsh-hook
load-nvmrc() {
  local node_version="$(nvm version)"
  local nvmrc_path="$(nvm_find_nvmrc)"

  if [ -n "$nvmrc_path" ]; then
    local nvmrc_node_version=$(nvm version "$(cat "${nvmrc_path}")")

    if [ "$nvmrc_node_version" = "N/A" ]; then
      echo "Node.js version in .nvmrc not installed. Installing..."
      nvm install
    elif [ "$nvmrc_node_version" != "$node_version" ]; then
      echo "Switching to Node.js version from .nvmrc..."
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

**설정 후:**
```bash
# 셸 재시작 또는
source ~/.zshrc

# 이제 프로젝트 디렉토리로 이동하면 자동으로 버전 전환
cd frontend
# 자동으로 Node.js 18로 전환됨
```

### Windows (PowerShell)

**PowerShell 프로필에 추가:**

```powershell
# 프로필 위치 확인
$PROFILE

# 프로필 편집
notepad $PROFILE

# 다음 함수 추가
function Set-NodeVersion {
    if (Test-Path .nvmrc) {
        $version = Get-Content .nvmrc
        nvm use $version
    }
}

# 디렉토리 변경 시 자동 실행
function prompt {
    Set-NodeVersion
    "PS $($executionContext.SessionState.Path.CurrentLocation)$('>' * ($nestedPromptLevel + 1)) "
}
```

## 📝 .nvmrc 파일 형식

### 버전 지정 방법

```bash
# 정확한 버전
18.20.0

# 메이저 버전만 (최신 마이너/패치 버전 사용)
18

# LTS 버전
lts/hydrogen  # Node.js 18 LTS
lts/iron      # Node.js 20 LTS

# 최신 버전 (권장하지 않음)
node
```

### 현재 프로젝트 설정

**파일**: `frontend/.nvmrc`
```
18
```

이 설정은:
- Node.js 18의 최신 마이너/패치 버전 사용
- 예: 18.20.0, 18.21.0 등

**더 엄격하게 고정하려면:**
```
18.20.0
```

## 🔍 다른 Node.js 버전 관리 도구

### 1. nodenv

**설정 파일**: `.node-version`
```bash
# 설치
brew install nodenv  # Mac
# 또는 https://github.com/nodenv/nodenv

# .node-version 파일 생성
echo "18.20.0" > .node-version

# 자동으로 버전 전환됨
```

### 2. asdf

**설정 파일**: `.tool-versions`
```bash
# 설치
brew install asdf  # Mac
# 또는 https://asdf-vm.com/guide/getting-started.html

# .tool-versions 파일 생성
echo "nodejs 18.20.0" > .tool-versions

# 자동으로 버전 전환됨
```

### 3. Volta

**설정 파일**: `package.json`의 `volta` 필드
```json
{
  "volta": {
    "node": "18.20.0"
  }
}
```

**장점**: 자동으로 버전 고정, 별도 파일 불필요

## ✅ 체크리스트

프로젝트에서 Node.js 버전 관리가 제대로 되고 있는지 확인:

- [ ] `.nvmrc` 파일이 `frontend/` 디렉토리에 존재
- [ ] `.nvmrc` 파일이 Git에 커밋되어 있음
- [ ] README.md에 Node.js 버전 요구사항 명시
- [ ] 팀원들이 nvm을 사용하고 있음
- [ ] CI/CD 환경에서도 동일한 Node.js 버전 사용

## 🚨 문제 해결

### 문제: `nvm: command not found`

**해결**:
```bash
# nvm이 설치되어 있는지 확인
which nvm

# 설치되어 있지 않다면 설치
# Windows: nvm-windows 설치
# Mac/Linux: nvm 설치 스크립트 실행
```

### 문제: `N/A: version "18" is not yet installed`

**해결**:
```bash
# 해당 버전 설치
nvm install 18

# 또는 .nvmrc 파일 기반으로 설치
nvm install
```

### 문제: 버전이 자동으로 전환되지 않음

**해결**:
```bash
# 수동으로 버전 전환
cd frontend
nvm use

# 자동화 스크립트가 설정되어 있는지 확인
# ~/.zshrc 또는 ~/.bashrc 확인
```

## 📚 관련 문서

- [의존성 관리](dependencies.md) - 전체 의존성 관리 가이드
- [프론트엔드 개요](../03-frontend/overview.md) - 프론트엔드 기술 스택

## 💡 결론

`.nvmrc` 파일은:
1. **프로젝트별 Node.js 버전 명시**: 각 프로젝트가 필요한 버전을 명확히 지정
2. **팀원 간 일관성 유지**: 모든 개발자가 동일한 버전 사용
3. **자동화 가능**: `nvm use` 명령어로 간편하게 버전 전환
4. **CI/CD 환경 일치**: 로컬과 서버 환경의 버전 일치

**현재 프로젝트**:
- ✅ `frontend/.nvmrc` 파일 생성 완료 (버전: 18)
- ✅ Git에 커밋되어 팀원들과 공유됨
- ✅ README.md에 요구사항 명시

**추가 권장 사항**:
- 팀원들에게 nvm 사용 안내
- CI/CD 환경에서도 `.nvmrc` 파일 사용
- 정기적으로 Node.js 버전 업데이트 검토

