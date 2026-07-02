import dashboardRepository from '../repositories/dashboardRepository.js';

const dashboardController = {
  async getDashboardSummary(req, res) {
    try {
      const summary = await dashboardRepository.getDashboardSummary(req.body);
      res.json(summary);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getLeads(req, res) {
    try {
      const opt = req.body;
      const leads = await dashboardRepository.getLeads(opt);
      res.json(leads);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export default dashboardController;
