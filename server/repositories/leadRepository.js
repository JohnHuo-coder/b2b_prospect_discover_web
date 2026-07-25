import leadProvider from '../providers/leadProvider.js';

const leadRepository = {
  getLeads: (opts) => leadProvider.getLeads(opts),
  getById: (opts) => leadProvider.getLeadById(opts),
  deleteLeadContact: (opts) => leadProvider.deleteLeadContact(opts),
  updateLeadStatus: (opts) => leadProvider.updateLeadStatus(opts),
  updateOutreachEmail: (opts) => leadProvider.updateOutreachEmail(opts),
  getOutreachSendContext: (opts) => leadProvider.getOutreachSendContext(opts),
  finalizeOutreachSend: (opts) => leadProvider.finalizeOutreachSend(opts),

  async sendThankYouEmail() {
    throw new Error('Not implemented');
  },
  async getThankYouTemplate() {
    throw new Error('Not implemented');
  },
};

export default leadRepository;
