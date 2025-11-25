export type UserRole = "ADMIN" | "USER";

export interface UserSummary {
  id: number;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: number;
    username: string;
    role: UserRole;
  };
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface UserCreateRequest {
  username: string;
  password: string;
  email: string;
  name: string;
  role: UserRole;
}

