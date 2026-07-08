import donationProvider from '../providers/donationProvider.js';

const donationRepository = {
  getUnsentIds: (filters) => donationProvider.getUnsentIds(filters),
  getUnsentRecipients: (filters) => donationProvider.getUnsentRecipients(filters),
  markManyReceiptStatus: (ids, status) =>
    donationProvider.markManyReceiptStatus(ids, status),
  deleteDonation: (id) => donationProvider.deleteDonation(id),

  async getDonations() {
    throw new Error('Not implemented');
  },
  async getById() {
    throw new Error('Not implemented');
  },
  async createDonation() {
    throw new Error('Not implemented');
  },
  async updateDonation() {
    throw new Error('Not implemented');
  },
  async updateReceiptStatus() {
    throw new Error('Not implemented');
  },
  async getMaxStripeCreatedAt() {
    throw new Error('Not implemented');
  },
  async existsByStripeId() {
    throw new Error('Not implemented');
  },
  async createStripeDonation() {
    throw new Error('Not implemented');
  },
};

export default donationRepository;
