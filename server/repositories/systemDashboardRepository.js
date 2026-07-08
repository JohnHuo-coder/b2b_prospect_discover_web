import systemDashboardProvider from '../providers/systemDashboardProvider.js';

const systemDashboardRepository = {
  getInfoAcquisitionStatus: (opts) =>
    systemDashboardProvider.getInfoAcquisitionStatus(opts),
  getInfoAcquisitionStatusDetail: (opts) =>
    systemDashboardProvider.getInfoAcquisitionStatusDetail(opts),
  getInfoAcquisitionStatusSummary: (opts) =>
    systemDashboardProvider.getInfoAcquisitionStatusSummary(opts),
  getInfoAcquisitionStatusSummaryByReq: (opts) =>
    systemDashboardProvider.getInfoAcquisitionStatusSummaryByReq(opts),
  getInfoAcquisitionStatusWorkflowByReq: (opts) =>
    systemDashboardProvider.getInfoAcquisitionStatusWorkflowByReq(opts),
  getInfoAcquisitionStageDetail: (opts) =>
    systemDashboardProvider.getInfoAcquisitionStageDetail(opts),
  getFitScoreStatus: (opts) => systemDashboardProvider.getFitScoreStatus(opts),
  getFitScoreStatusDetail: (opts) =>
    systemDashboardProvider.getFitScoreStatusDetail(opts),
  getFitScoreStatusSummary: (opts) =>
    systemDashboardProvider.getFitScoreStatusSummary(opts),
  getFitScoreStatusSummaryByReq: (opts) =>
    systemDashboardProvider.getFitScoreStatusSummaryByReq(opts),
  getFindContactStatus: (opts) =>
    systemDashboardProvider.getFindContactStatus(opts),
  getFindContactStatusDetail: (opts) =>
    systemDashboardProvider.getFindContactStatusDetail(opts),
  getFindContactStatusSummary: (opts) =>
    systemDashboardProvider.getFindContactStatusSummary(opts),
  getFindContactStatusWorkflow: (opts) =>
    systemDashboardProvider.getFindContactStatusWorkflow(opts),
  getFindContactStageDetail: (opts) =>
    systemDashboardProvider.getFindContactStageDetail(opts),
  getOutReachStatus: (opts) => systemDashboardProvider.getOutReachStatus(opts),
  getOutreachStatusDetail: (opts) =>
    systemDashboardProvider.getOutreachStatusDetail(opts),
  getOutreachStatusSummary: (opts) =>
    systemDashboardProvider.getOutreachStatusSummary(opts),
  getOutreachStatusWorkflow: (opts) =>
    systemDashboardProvider.getOutreachStatusWorkflow(opts),
  getOutreachStageDetail: (opts) =>
    systemDashboardProvider.getOutreachStageDetail(opts),
  updateOutreachStatus: (opts) =>
    systemDashboardProvider.updateOutreachStatus(opts),
};

export default systemDashboardRepository;
