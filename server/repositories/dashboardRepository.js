import pgProvider from '../providers/pgProvider.js';

const provider = pgProvider;

const dashboardRepository = {
  getDashboardSummary: (opts) => provider.getDashboardSummary(opts),
  getLeads: (opt) => provider.getLeads(opt),
};

export default dashboardRepository;
