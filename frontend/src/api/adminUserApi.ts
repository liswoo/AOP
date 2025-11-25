/**
 * 어드민 사용자 관리 API 함수
 * 
 * 사용자 목록 조회, 사용자 생성 등의 어드민 기능을 제공하는 API를 호출하는 함수들을 정의합니다.
 * 
 * 주의: 이 API들은 ADMIN 권한이 필요합니다.
 * Authorization 헤더에 Bearer 토큰이 포함되어야 하며,
 * apiClient의 요청 인터셉터가 자동으로 토큰을 추가합니다.
 */

import apiClient from './client';
import { Page, UserSummary, UserCreateRequest, UserUpdateRequest } from '../types';

/**
 * 사용자 목록 조회 (페이지네이션 및 검색 지원)
 * 
 * @param page 페이지 번호 (0부터 시작, 기본값: 0)
 * @param size 페이지 크기 (기본값: 20)
 * @param keyword 검색 키워드 (username 또는 name에 LIKE 검색, 선택사항)
 * @returns 페이지네이션 정보를 포함한 사용자 목록
 * 
 * 사용 예시:
 * const userPage = await getUsers(0, 20, 'admin');
 * console.log(userPage.content);      // 사용자 목록
 * console.log(userPage.totalElements); // 전체 사용자 수
 * console.log(userPage.totalPages);    // 전체 페이지 수
 */
export const getUsers = async (
  page: number = 0,
  size: number = 20,
  keyword?: string
): Promise<Page<UserSummary>> => {
  // 쿼리 파라미터 구성
  const params: Record<string, string> = {
    page: page.toString(),
    size: size.toString(),
  };
  
  // keyword가 있으면 쿼리 파라미터에 추가
  if (keyword) {
    params.keyword = keyword;
  }
  
  const response = await apiClient.get<Page<UserSummary>>('/admin/users', {
    params,
  });
  
  return response.data;
};

/**
 * 사용자 생성
 * 
 * @param userData 생성할 사용자 정보
 * @returns 생성된 사용자 정보
 * 
 * 사용 예시:
 * const newUser = await createUser({
 *   username: 'user01',
 *   password: 'user1234',
 *   email: 'user01@example.com',
 *   name: '홍길동',
 *   role: 'USER'
 * });
 */
export const createUser = async (userData: UserCreateRequest): Promise<UserSummary> => {
  const response = await apiClient.post<UserSummary>('/admin/users', userData);
  return response.data;
};

/**
 * 사용자 정보 수정
 * 
 * PUT /api/admin/users/{id} API를 호출하여 사용자 정보를 수정합니다.
 * 
 * @param id 수정할 사용자 ID
 * @param payload 수정할 사용자 정보 (email, name, role, enabled 중 선택)
 * @returns 수정된 사용자 정보
 * 
 * 사용 예시:
 * const updatedUser = await updateUser(1, {
 *   email: 'new@example.com',
 *   name: '새 이름',
 *   role: 'ADMIN',
 *   enabled: true
 * });
 */
export const updateUser = async (
  id: number,
  payload: UserUpdateRequest
): Promise<UserSummary> => {
  const response = await apiClient.put<UserSummary>(`/admin/users/${id}`, payload);
  return response.data;
};

/**
 * 사용자 활성/비활성 상태 변경
 * 
 * PATCH /api/admin/users/{id}/status API를 호출하여 사용자의 활성화 상태를 변경합니다.
 * 
 * @param id 상태를 변경할 사용자 ID
 * @param enabled 활성화 여부 (true: 활성화, false: 비활성화)
 * @returns 변경된 사용자 정보
 * 
 * 사용 예시:
 * const user = await updateUserStatus(1, false); // 사용자 비활성화
 */
export const updateUserStatus = async (
  id: number,
  enabled: boolean
): Promise<UserSummary> => {
  const response = await apiClient.patch<UserSummary>(`/admin/users/${id}/status`, {
    enabled,
  });
  return response.data;
};

/**
 * 사용자 삭제
 * 
 * DELETE /api/admin/users/{id} API를 호출하여 사용자를 물리적으로 삭제합니다.
 * 
 * 주의:
 * - ADMIN 계정(id=1)은 삭제할 수 없습니다.
 * - 삭제는 되돌릴 수 없으므로 주의하세요.
 * 
 * @param id 삭제할 사용자 ID
 * @returns Promise<void> (성공 시 204 No Content)
 * 
 * 사용 예시:
 * await deleteUser(2); // ID가 2인 사용자 삭제
 */
export const deleteUser = async (id: number): Promise<void> => {
  await apiClient.delete(`/admin/users/${id}`);
};


