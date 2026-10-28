import type { ApplicationSummary } from "@/lib/types";
import { mockApplicationSummaries } from "@/lib/mock-data/applications";
import { appConfig } from "@/lib/config/env";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface AdminDashboardStats {
  total: number;
  submitted: number;
  underReview: number;
  actionRequired: number;
  approved: number;
  rejected: number;
}

export interface AdminService {
  listAllApplications: (filters?: Record<string, unknown>) => Promise<ApplicationSummary[]>;
  getDashboardStats: () => Promise<AdminDashboardStats>;
}

class MockAdminService implements AdminService {
  async listAllApplications() {
    await delay(appConfig.mockLatencyMs);
    return mockApplicationSummaries;
  }

  async getDashboardStats() {
    await delay(appConfig.mockLatencyMs);
    return {
      total: 1,
      submitted: 0,
      underReview: 1,
      actionRequired: 0,
      approved: 0,
      rejected: 0,
    };
  }
}

export const adminService: AdminService = new MockAdminService();
