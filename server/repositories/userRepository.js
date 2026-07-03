import pgProvider from '../providers/pgProvider.js';

const provider = pgProvider;

const userRepository = {
  createUser: (userData) => provider.createUser(userData),
  deleteByUid: (uid) => provider.deleteUserByUid(uid),

  findByUid: (uid) => provider.findByUid(uid),
  // getAll: () => provider.getAll(),

  findOrCreate: (userData) => provider.findOrCreate(userData),
  setRole: (uid, role) => provider.setRole(uid, role),
  updateUserBusinessId: (body) => provider.updateUserBusinessId(body),
};

export default userRepository;
