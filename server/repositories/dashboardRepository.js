import pgProvider from '../providers/pgProvider.js';

const provider = pgProvider;

const dashboardRepository = {
  getDashboardSummary: (business_id) => provider.getDashboardSummary(business_id),
  getLeads: (opt) => provider.getLeads(opt),
};

export default dashboardRepository;
