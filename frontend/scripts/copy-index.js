// 빌드 후 모든 경로에 index.html을 복사하는 스크립트
// Render Static Site에서 SPA 라우팅을 지원하기 위함

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distDir, 'index.html');

// index.html이 존재하는지 확인
if (!fs.existsSync(indexPath)) {
  console.error('index.html을 찾을 수 없습니다. 빌드를 먼저 실행하세요.');
  process.exit(1);
}

// index.html 읽기
const indexContent = fs.readFileSync(indexPath, 'utf-8');

// 주요 라우트 경로 목록 (React Router의 경로와 일치해야 함)
const routes = [
  'login',
  'dashboard',
  'profile',
  'reports',
  'admin',
  'admin/users'
];

console.log('SPA 라우팅을 위한 index.html 복사 중...');

// 각 라우트 경로에 index.html 복사
for (const route of routes) {
  const routeDir = path.join(distDir, route);
  
  // 디렉토리가 없으면 생성
  if (!fs.existsSync(routeDir)) {
    fs.mkdirSync(routeDir, { recursive: true });
  }
  
  // index.html 복사
  const routeIndexPath = path.join(routeDir, 'index.html');
  fs.writeFileSync(routeIndexPath, indexContent);
  console.log(`✓ ${route}/index.html 생성됨`);
}

console.log('완료!');

