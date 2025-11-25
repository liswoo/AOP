/**
 * 프로필 관련 API 함수
 * 
 * 로그인한 사용자가 자신의 정보를 조회/수정하는 API를 호출하는 함수들을 정의합니다.
 * 
 * 주의: 이 API들은 인증이 필요합니다 (어떤 ROLE이든 로그인만 되어 있으면 접근 가능).
 * Authorization 헤더에 Bearer 토큰이 포함되어야 하며,
 * apiClient의 요청 인터셉터가 자동으로 토큰을 추가합니다.
 */

import apiClient from './client';
import { Profile } from '../types';

/**
 * 내 정보 조회
 * 
 * GET /api/profile API를 호출하여 현재 로그인한 사용자의 프로필 정보를 가져옵니다.
 * 
 * @returns 현재 로그인한 사용자의 프로필 정보
 * 
 * 사용 예시:
 * const profile = await getMyProfile();
 * console.log(profile.name);  // 사용자 이름
 * console.log(profile.email); // 사용자 이메일
 */
export const getMyProfile = async (): Promise<Profile> => {
  const response = await apiClient.get<Profile>('/profile');
  return response.data;
};

/**
 * 내 정보 수정
 * 
 * PUT /api/profile API를 호출하여 현재 로그인한 사용자의 이름과 이메일을 수정합니다.
 * 
 * @param payload 수정할 정보 (이름, 이메일)
 * @returns 수정된 사용자 프로필 정보
 * 
 * 사용 예시:
 * const updatedProfile = await updateMyProfile({
 *   name: '홍길동',
 *   email: 'hong@example.com'
 * });
 */
export const updateMyProfile = async (payload: {
  name: string;
  email: string;
}): Promise<Profile> => {
  const response = await apiClient.put<Profile>('/profile', payload);
  return response.data;
};

/**
 * 비밀번호 변경
 * 
 * PATCH /api/profile/password API를 호출하여 현재 로그인한 사용자의 비밀번호를 변경합니다.
 * 
 * @param payload 비밀번호 변경 정보 (현재 비밀번호, 새 비밀번호)
 * @returns Promise<void> (성공 시 204 No Content)
 * 
 * 사용 예시:
 * await changeMyPassword({
 *   currentPassword: 'old1234',
 *   newPassword: 'new1234'
 * });
 */
export const changeMyPassword = async (payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> => {
  await apiClient.patch('/profile/password', payload);
};

