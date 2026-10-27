import type { VideoKycSlot } from "@/lib/types";
import { videoKycSlots } from "@/lib/mock-data/applications";
import { appConfig } from "@/lib/config/env";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface VerificationService {
  getVideoSlots: () => Promise<VideoKycSlot[]>;
  scheduleVideoKyc: (slotId: string) => Promise<{ scheduled: boolean }>;
}

class MockVerificationService implements VerificationService {
  async getVideoSlots() {
    await delay(appConfig.mockLatencyMs);
    return videoKycSlots;
  }

  async scheduleVideoKyc() {
    await delay(appConfig.mockLatencyMs);
    return { scheduled: true };
  }
}

export const verificationService: VerificationService = new MockVerificationService();
