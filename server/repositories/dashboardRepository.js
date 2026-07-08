import dashboardProvider from '../providers/dashboardProvider.js';
import leadProvider from '../providers/leadProvider.js';

const dashboardRepository = {
  getDashboardSummary: (opts) => dashboardProvider.getDashboardSummary(opts),
  getLeads: (opt) => leadProvider.getLeads(opt),
};

export default dashboardRepository;
