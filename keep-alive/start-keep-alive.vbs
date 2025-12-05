' Render Keep-Alive 스크립트를 완전히 독립적으로 실행하는 VBScript
' 터미널을 닫아도 계속 실행됩니다

Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' 현재 스크립트의 경로 가져오기
strScriptPath = objFSO.GetParentFolderName(WScript.ScriptFullName)
strNodePath = "node"
strKeepAlivePath = Chr(34) & strScriptPath & "\keep-alive.js" & Chr(34)
strLogPath = strScriptPath & "\keep-alive.log"

' Node.js 프로세스를 완전히 독립적으로 실행
' Run 메서드의 0은 창을 숨기고, True는 프로세스를 독립적으로 실행
objShell.Run strNodePath & " " & strKeepAlivePath & " > " & Chr(34) & strLogPath & Chr(34) & " 2>&1", 0, False

' VBScript는 즉시 종료되지만 Node.js 프로세스는 계속 실행됨

