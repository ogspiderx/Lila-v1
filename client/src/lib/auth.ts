import { apiRequest } from "./queryClient";

export interface User {
  id: string;
  username: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

const TOKEN_KEY = "chat_token";
const USER_KEY = "chat_user";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

export function setAuthData(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthData(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  const response = await apiRequest("POST", "/api/auth/login", {
    username,
    password,
  });
  
  const data = await response.json();
  setAuthData(data.token, data.user);
  return data;
}

export function logout(): void {
  clearAuthData();
}

export function isAuthenticated(): boolean {
  const token = getStoredToken();
  const user = getStoredUser();
  
  // Validate that we have both token and user, and user has expected format
  if (!token || !user || !user.id || !user.username) {
    clearAuthData(); // Clear invalid data
    return false;
  }
  
  return true;
}
