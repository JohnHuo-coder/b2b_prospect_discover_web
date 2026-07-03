import userRepository from '../repositories/userRepository.js';

const authController = {

  async logout(_req, res) {
    try {
      res.clearCookie('session', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  },

  async getAllUsers(_req, res) {
    try {
      const users = await userRepository.getAll();

      res.status(200).json(users);
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async setRole(req, res) {
    try {
      const { uid } = req.params;
      const { role } = req.body;

      if (!['pending', 'member', 'owner'].includes(role)) {
        return res.status(400).json({ error: 'role must be pending, member, or owner' });
      }

      if (uid === req.user.firebaseUid) {
        return res.status(400).json({ error: 'Cannot change your own role' });
      }

      const updatedUser = await userRepository.setRole(uid, role);

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json({ message: 'User role updated', user: updatedUser });
    } catch (error) {
      console.error('Set role error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

export default authController;
