@echo off
REM Render Keep-Alive 스크립트를 완전히 독립적으로 실행 (터미널 닫아도 계속 실행)
REM VBScript를 사용하여 부모 프로세스와 완전히 분리

echo Keep-Alive 스크립트를 시작합니다...

REM VBScript를 사용하여 완전히 독립적인 프로세스로 실행
cscript //nologo "%~dp0start-keep-alive.vbs"

echo.
echo Keep-Alive 스크립트가 백그라운드에서 시작되었습니다.
echo 로그 파일: %~dp0keep-alive.log
echo.
echo 프로세스 확인: wmic process where "CommandLine like '%%keep-alive.js%%'" get ProcessId,CommandLine
echo 수동 종료: taskkill /F /PID [PID번호]
echo.
echo 배치 파일을 닫아도 프로세스는 계속 실행됩니다.
timeout /t 2 >nul

