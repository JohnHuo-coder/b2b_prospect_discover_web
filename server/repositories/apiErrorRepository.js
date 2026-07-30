import apiErrorProvider from '../providers/apiErrorProvider.js';

const apiErrorRepository = {
  listApiErrorConfigs: (opts) => apiErrorProvider.listApiErrorConfigs(opts),
  getApiErrorWorkflowSummary: (opts) =>
    apiErrorProvider.getApiErrorWorkflowSummary(opts),
  getApiErrorApiSummary: (opts) => apiErrorProvider.getApiErrorApiSummary(opts),
  getApiErrorExecutions: (opts) => apiErrorProvider.getApiErrorExecutions(opts),
};

export default apiErrorRepository;
