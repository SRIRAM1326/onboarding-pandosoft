/**
 * Environment-based configuration.
 *
 * `NEXT_PUBLIC_API_BASE_URL` is reserved for the future FastAPI backend.
 * While `NEXT_PUBLIC_DATA_SOURCE` is "mock" (the default), every service call
 * is served by the in-memory mock implementation and nothing leaves the browser.
 */
export type DataSource = "mock" | "api";

function readNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const appConfig = {
  appName: "Pixelonics Client Onboarding",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1",
  dataSource: (process.env.NEXT_PUBLIC_DATA_SOURCE === "api" ? "api" : "mock") as DataSource,
  /** Simulated network latency for mock services, in milliseconds. */
  mockLatencyMs: readNumber(process.env.NEXT_PUBLIC_MOCK_LATENCY_MS, 350),
  supportEmail: "onboarding-support@pixelonics.example",
} as const;

export const isDemoMode = appConfig.dataSource === "mock";
