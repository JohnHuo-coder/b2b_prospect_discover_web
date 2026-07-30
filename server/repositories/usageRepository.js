import usageProvider from '../providers/usageProvider.js';

const usageRepository = {
  getBusinessLevelUsage: (opts) => usageProvider.getBusinessLevelUsage(opts),
  getCandidateLevelSummary: (opts) => usageProvider.getCandidateLevelSummary(opts),
  getCandidateLevelStages: (opts) => usageProvider.getCandidateLevelStages(opts),
  getCandidateLevelStageDetail: (opts) =>
    usageProvider.getCandidateLevelStageDetail(opts),
  getCandidateLevelLeads: (opts) => usageProvider.getCandidateLevelLeads(opts),
};

export default usageRepository;
