/**
 * Axios 클라이언트 설정
 * 
 * 이 파일은 백엔드 API와 통신하기 위한 axios 인스턴스를 생성하고 설정합니다.
 * 
 * 주요 기능:
 * 1. baseURL 설정: 모든 요청의 기본 URL을 http://localhost:8080/api로 설정
 * 2. 요청 인터셉터: localStorage에 저장된 accessToken을 자동으로 Authorization 헤더에 추가
 * 3. 응답 인터셉터: 에러 응답(401, 403 등) 처리
 */

import axios, { AxiosError } from 'axios';

// axios 인스턴스 생성
// baseURL을 설정하면 모든 요청이 이 URL을 기본으로 사용합니다.
// 예: apiClient.get('/auth/me') → http://localhost:8080/api/auth/me
// 환경 변수 VITE_API_BASE_URL이 설정되어 있으면 사용하고, 없으면 로컬 개발 서버 사용
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 요청 인터셉터
 * 
 * 모든 API 요청이 전송되기 전에 실행됩니다.
 * localStorage에서 accessToken을 가져와서 Authorization 헤더에 자동으로 추가합니다.
 * 
 * 동작 방식:
 * 1. localStorage에서 'accessToken' 키로 저장된 토큰을 읽어옵니다.
 * 2. 토큰이 있으면 'Bearer {토큰}' 형식으로 Authorization 헤더에 추가합니다.
 * 3. 토큰이 없으면 헤더를 추가하지 않습니다 (로그인 전 상태).
 */
apiClient.interceptors.request.use(
  (config) => {
    // localStorage에서 accessToken 읽기
    const token = localStorage.getItem('accessToken');
    
    // 토큰이 있으면 Authorization 헤더에 추가
    if (token && config.headers) {
      // headers가 객체인지 확인하고 타입 단언
      if (typeof config.headers === 'object' && config.headers !== null) {
        (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    // 요청 설정 중 에러가 발생하면 그대로 반환
    return Promise.reject(error);
  }
);

/**
 * 응답 인터셉터
 * 
 * 모든 API 응답을 받은 후 실행됩니다.
 * 에러 응답(401, 403 등)을 처리합니다.
 * 
 * 동작 방식:
 * 1. 응답이 정상이면 그대로 반환합니다.
 * 2. 401 (Unauthorized) 또는 403 (Forbidden) 에러가 발생하면:
 *    - 콘솔에 에러 로그를 출력합니다.
 *    - localStorage에서 토큰을 제거합니다 (만료되었거나 유효하지 않음).
 *    - 필요시 로그인 페이지로 리다이렉트할 수 있습니다.
 */
apiClient.interceptors.response.use(
  (response) => {
    // 정상 응답은 그대로 반환
    return response;
  },
  (error: AxiosError) => {
    // 에러 응답 처리
    if (error.response) {
      const status = error.response.status;
      const url = error.config?.url || '';
      
      // 401: 인증 실패 (토큰이 없거나 유효하지 않음)
      // 403: 권한 없음 (인증은 되었지만 권한이 부족함)
      if (status === 401 || status === 403) {
        console.error('인증/권한 에러:', error.response.data);
        
        // localStorage에서 토큰 제거
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        
        // /auth/me 호출 실패 시에는 alert를 띄우지 않고 리다이렉트도 하지 않음 (초기화 중일 수 있음)
        // 다른 API 호출 실패 시에는 자동으로 로그인 페이지로 리다이렉트
        if (url !== '/auth/me') {
          // 자동으로 로그인 페이지로 리다이렉트 (전체 페이지 리로드)
          window.location.href = '/login';
        }
      } else {
        // 다른 에러 (400, 500 등)
        console.error('API 에러:', error.response.data);
      }
    } else if (error.request) {
      // 요청은 보냈지만 응답을 받지 못한 경우 (네트워크 에러 등)
      console.error('네트워크 에러:', error.message);
      const url = error.config?.url || '';
      // /auth/me 호출 실패 시에는 alert를 띄우지 않음
      if (url !== '/auth/me') {
        alert('서버에 연결할 수 없습니다. 네트워크를 확인해주세요.');
      }
    } else {
      // 요청 설정 중 에러가 발생한 경우
      console.error('요청 설정 에러:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

