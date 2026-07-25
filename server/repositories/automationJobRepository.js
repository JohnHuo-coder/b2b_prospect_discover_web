import automationJobProvider from '../providers/automationJobProvider.js';

const automationJobRepository = {
  getBusinessDiscoveryQuota: (business_id) =>
    automationJobProvider.getBusinessDiscoveryQuota(business_id),
  getDiscoveryJobStats: (business_id, version) =>
    automationJobProvider.getDiscoveryJobStats(business_id, version),
  validateStartDiscovery: (opts) =>
    automationJobProvider.validateStartDiscovery(opts),
  reserveRunningAutomationJob: (opts) =>
    automationJobProvider.reserveRunningAutomationJob(opts),
  createRunningAutomationJob: (opts) =>
    automationJobProvider.createRunningAutomationJob(opts),
  updateAutomationJobStatus: (jobId, status) =>
    automationJobProvider.updateAutomationJobStatus(jobId, status),
};

export default automationJobRepository;
