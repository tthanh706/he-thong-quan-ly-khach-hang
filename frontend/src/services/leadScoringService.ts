// File: src/services/leadScoringService.ts
export const leadScoringService = {
  getConfig: async () => {
    return { configs: [], thresholds: [] };
  },
  updateConfig: async (data: { configs: any[]; thresholds: any[] }) => {
    return { success: true, data };
  }
};