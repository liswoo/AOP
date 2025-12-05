/**
 * Render 서비스 Keep-Alive 스크립트
 * 
 * 이 스크립트는 일정 시간마다 백엔드 서버에 health check 요청을 보내서
 * Render의 무료 티어 sleep 상태를 방지합니다.
 * 
 * 사용법:
 * 1. 백엔드 URL을 설정하세요 (BACKEND_URL)
 * 2. 실행: node keep-alive.js
 * 3. 백그라운드 실행: node keep-alive.js > keep-alive.log 2>&1 &
 * 
 * Windows에서 백그라운드 실행:
 * - PowerShell: Start-Process node -ArgumentList "keep-alive.js" -WindowStyle Hidden
 * - 또는 작업 스케줄러 사용
 */

const https = require('https');
const http = require('http');

// 설정
const BACKEND_URL = 'https://aop-backend.onrender.com';
const HEALTH_ENDPOINT = '/api/auth/health';
const PING_INTERVAL = 14 * 60 * 1000; // 14분 (Render는 15분 미사용 시 sleep)

// 로그 함수 (UTF-8 인코딩 지원)
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  // 콘솔 출력
  console.log(`[${timestamp}] ${message}`);
  // 파일 출력 (UTF-8)
  const fs = require('fs');
  fs.appendFileSync('keep-alive.log', logMessage, 'utf8');
}

// Health check 요청
async function pingServer() {
  const url = new URL(HEALTH_ENDPOINT, BACKEND_URL);
  const client = url.protocol === 'https:' ? https : http;
  
  return new Promise((resolve, reject) => {
    const req = client.request(url, { method: 'GET' }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          log(`✓ Health check 성공: ${res.statusCode}`);
          resolve(true);
        } else {
          log(`✗ Health check 실패: ${res.statusCode}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      log(`✗ 요청 에러: ${error.message}`);
      reject(error);
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      log('✗ 요청 타임아웃 (30초)');
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// 메인 함수
async function main() {
  log('========================================');
  log('Render Keep-Alive 스크립트 시작');
  log(`백엔드 URL: ${BACKEND_URL}`);
  log(`Health Endpoint: ${HEALTH_ENDPOINT}`);
  log(`Ping 간격: ${PING_INTERVAL / 1000 / 60}분`);
  log('========================================');
  
  // 즉시 한 번 실행
  try {
    await pingServer();
  } catch (error) {
    log(`초기 ping 실패: ${error.message}`);
  }
  
  // 주기적으로 실행
  setInterval(async () => {
    try {
      await pingServer();
    } catch (error) {
      log(`Ping 실패: ${error.message}`);
    }
  }, PING_INTERVAL);
  
  log('스크립트가 실행 중입니다. 종료하려면 Ctrl+C를 누르세요.');
}

// 에러 핸들링
process.on('unhandledRejection', (error) => {
  log(`처리되지 않은 에러: ${error.message}`);
});

// 시작
main().catch((error) => {
  log(`시작 실패: ${error.message}`);
  process.exit(1);
});

