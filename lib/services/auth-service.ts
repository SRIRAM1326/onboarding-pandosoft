import type { User } from "@/lib/types";
import { mockUsers, currentMockUser } from "@/lib/mock-data/users";
import { appConfig } from "@/lib/config/env";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface AuthService {
  getCurrentUser: () => Promise<User>;
  login: (email: string, password: string) => Promise<{ user: User; token: string }>;
  logout: () => Promise<void>;
}

class MockAuthService implements AuthService {
  async getCurrentUser() {
    await delay(appConfig.mockLatencyMs);
    return currentMockUser;
  }

  async login(email: string) {
    await delay(appConfig.mockLatencyMs);
    const user = mockUsers.find((u) => u.email === email) ?? currentMockUser;
    return { user, token: "demo-token-not-real" };
  }

  async logout() {
    await delay(150);
  }
}

export const authService: AuthService = new MockAuthService();
