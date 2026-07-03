import mysqlProvider from '../providers/pgProvider.js';

const p = mysqlProvider;

const leadRepository = {
  getLeads: (opts) => p.getLeads(opts),
  getById: (opts) => p.getLeadById(opts),
  deleteLead: (id) => p.deleteLead(id),

  async sendThankYouEmail() {
    throw new Error('Not implemented');
  },
  async getThankYouTemplate() {
    throw new Error('Not implemented');
  },
};

export default leadRepository;
