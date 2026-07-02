import businessRepository from '../repositories/businessRepository.js';

const businessController = {
  
    async updateDonorDetail(req, res) {
      const id = req.params.id;
      try {
        const { phone } = req.body;
        if (phone) {
          if (/[^\d+() -]/.test(String(phone)))
            return res.status(400).json({ error: 'Invalid phone number format' });
          if (String(phone).replace(/\D/g, '').length < 7)
            return res.status(400).json({ error: 'Invalid phone number format' });
        }
        const result = await businessRepository.updateBusinessConfig(id, req.body);
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'business not found' });
        }
        res.json({ message: 'Business config updated successfully' });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
      }
    },

    async getAllBusinessMembers(req, res) {
      try {
        const bid = req.user.business_id
        const users = await businessRepository.getAllBusinessMember(bid);
        res.status(200).json(users);
      } catch (error) {
        console.error('Get all business members error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    },
  };
  
  export default businessController;