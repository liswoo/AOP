/**
 * 애플리케이션 진입점 (Entry Point)
 * 
 * 이 파일은 React 애플리케이션이 시작되는 지점입니다.
 * 
 * 동작 흐름:
 * 1. index.html의 <div id="root"> 요소를 찾습니다.
 * 2. AppRouter 컴포넌트를 렌더링합니다.
 * 3. AppRouter는 AuthProvider와 BrowserRouter를 설정하고 라우팅을 시작합니다.
 * 
 * StrictMode:
 * - React의 개발 모드에서 잠재적인 문제를 찾아주는 도구입니다.
 * - 프로덕션 빌드에는 영향을 주지 않습니다.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import AppRouter from './routes/AppRouter';
import ErrorBoundary from './components/ErrorBoundary';

// index.html의 <div id="root"> 요소를 찾아서 React 앱을 렌더링
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('root element를 찾을 수 없습니다.');
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  </StrictMode>
);
