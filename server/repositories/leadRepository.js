import leadProvider from '../providers/leadProvider.js';

const leadRepository = {
  getLeads: (opts) => leadProvider.getLeads(opts),
  getById: (opts) => leadProvider.getLeadById(opts),
  deleteLead: (id) => leadProvider.deleteLead(id),
  updateLeadStatus: (opts) => leadProvider.updateLeadStatus(opts),

  async sendThankYouEmail() {
    throw new Error('Not implemented');
  },
  async getThankYouTemplate() {
    throw new Error('Not implemented');
  },
};

export default leadRepository;
