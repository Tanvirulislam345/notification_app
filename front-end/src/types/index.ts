export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
  organizationId: string;
}

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  status: string;
  createdAt: string;
}

export interface Member {
  userId: string;
  email: string;
  name: string;
  role: string;
  joinedAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  organizationId: string;
  roleId: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  organizationId: string | null;
}

export interface ApiError {
  message: string | string[];
  statusCode: number;
}
