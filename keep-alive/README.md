# Render Keep-Alive 스크립트

Render 무료 티어의 sleep 상태를 방지하기 위한 keep-alive 스크립트입니다.

## 문제 상황

Render 무료 티어는 15분 이상 요청이 없으면 자동으로 sleep 상태가 됩니다.  
sleep 상태에서 깨어나려면 50초 이상의 시간이 걸립니다.

## 해결 방법

14분마다 백엔드의 `/api/auth/health` 엔드포인트에 요청을 보내서  
서버를 활성 상태로 유지합니다.

## 파일 구성

- `keep-alive.js` - 핵심 스크립트 (Node.js)
- `start-keep-alive.bat` - 실행용 배치 파일
- `start-keep-alive.vbs` - 독립 실행을 위한 VBScript (내부 사용)

## 사용 방법

### 실행

```cmd
start-keep-alive.bat
```

배치 파일을 실행하면:
1. VBScript를 통해 Node.js 프로세스가 독립적으로 시작됩니다
2. 배치 파일은 메시지를 표시하고 2초 후 자동으로 종료됩니다
3. Node.js 프로세스는 백그라운드에서 계속 실행됩니다
4. 터미널을 닫아도 프로세스는 계속 실행됩니다

### 종료 (수동)

#### 1. 실행 중인 keep-alive 프로세스 확인

```cmd
wmic process where "CommandLine like '%keep-alive.js%'" get ProcessId,CommandLine
```

출력 예시:
```
CommandLine                                              ProcessId
node.exe "C:\Users\cnkp\Desktop\AOP\keep-alive\keep-alive.js"  12345
```

#### 2. 프로세스 종료

PID를 확인한 후 종료:

```cmd
taskkill /F /PID 12345
```

또는 한 번에 실행:

```cmd
for /f "tokens=2" %a in ('wmic process where "CommandLine like '%%keep-alive.js%%'" get ProcessId /format:value ^| findstr "ProcessId"') do taskkill /F /PID %a
```

## 설정 변경

### 백엔드 URL 변경

`keep-alive.js` 파일을 열어서 `BACKEND_URL` 변수를 수정:

```javascript
const BACKEND_URL = 'https://your-backend.onrender.com';
```

### Ping 간격 변경

`keep-alive.js` 파일을 열어서 `PING_INTERVAL` 변수를 수정:

```javascript
const PING_INTERVAL = 14 * 60 * 1000; // 14분 (밀리초)
```

권장: 10-14분 (Render는 15분 미사용 시 sleep)

## 로그 확인

```cmd
type keep-alive.log
```

또는 PowerShell에서:

```powershell
Get-Content keep-alive.log -Encoding UTF8 -Tail 20
```

## 프로세스 확인

모든 Node.js 프로세스 확인:

```cmd
tasklist | findstr node
```

Keep-Alive 프로세스만 확인:

```cmd
wmic process where "CommandLine like '%keep-alive.js%'" get ProcessId,CommandLine
```

## 자동 시작 설정

컴퓨터가 켜질 때 자동으로 실행하려면 작업 스케줄러를 사용하세요.

1. **작업 스케줄러 열기**
   - Windows 검색에서 "작업 스케줄러" 검색

2. **기본 작업 만들기**
   - 오른쪽 "기본 작업 만들기" 클릭

3. **설정:**
   - **이름**: `Render Keep-Alive`
   - **트리거**: "컴퓨터 시작 시"
   - **동작**: "프로그램 시작"
     - **프로그램/스크립트**: `C:\Users\cnkp\Desktop\AOP\keep-alive\start-keep-alive.bat`
     - **시작 위치**: `C:\Users\cnkp\Desktop\AOP\keep-alive`

## 주의사항

1. **컴퓨터가 켜져 있어야 함**: 로컬에서 실행하는 경우 컴퓨터가 켜져 있어야 합니다
2. **인터넷 연결 필요**: 인터넷 연결이 끊기면 ping이 실패합니다
3. **리소스 사용**: 매우 적은 리소스만 사용하지만, 24시간 실행 시 약간의 전력이 소모됩니다

## 문제 해결

### "Health check 실패" 메시지가 나오는 경우

1. 백엔드 URL이 올바른지 확인
2. 백엔드 서버가 실행 중인지 확인
3. 네트워크 연결 확인

### 프로세스가 실행되지 않는 경우

1. Node.js가 설치되어 있는지 확인: `node --version`
2. `keep-alive.js` 파일 경로가 올바른지 확인
3. 로그 파일(`keep-alive.log`) 확인

