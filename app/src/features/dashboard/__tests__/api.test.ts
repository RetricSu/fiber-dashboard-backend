import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchDashboardData, fetchKpiData } from "../api/client";
import { KpiDataSchema } from "../api/types";

// Mock fetch
global.fetch = vi.fn();

describe("API Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchDashboardData", () => {
    it("returns mock data when no real API is configured", async () => {
      const data = await fetchDashboardData();

      expect(data).toHaveProperty("kpis");
      expect(data).toHaveProperty("timeSeries");
      expect(data).toHaveProperty("geoNodes");
      expect(data).toHaveProperty("ispRankings");

      // Validate KPI data structure
      const kpiValidation = KpiDataSchema.safeParse(data.kpis);
      expect(kpiValidation.success).toBe(true);
    });

    it("returns mock data when real API fails", async () => {
      (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("API Error")
      );

      const data = await fetchDashboardData();

      expect(data).toHaveProperty("kpis");
      expect(data.kpis.totalCapacity).toBeGreaterThan(0);
    });
  });

  describe("fetchKpiData", () => {
    it("returns KPI data from dashboard", async () => {
      const kpiData = await fetchKpiData();

      expect(kpiData).toHaveProperty("totalCapacity");
      expect(kpiData).toHaveProperty("totalNodes");
      expect(kpiData).toHaveProperty("totalChannels");
      expect(kpiData).toHaveProperty("averageChannelCapacity");
      expect(kpiData).toHaveProperty("networkGrowth");

      expect(typeof kpiData.totalCapacity).toBe("number");
      expect(typeof kpiData.totalNodes).toBe("number");
      expect(typeof kpiData.totalChannels).toBe("number");
    });
  });
});
