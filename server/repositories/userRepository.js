import userProvider from '../providers/userProvider.js';

const userRepository = {
  createUser: (userData) => userProvider.createUser(userData),
  deleteByUid: (uid) => userProvider.deleteUserByUid(uid),
  findByUid: (uid) => userProvider.findByUid(uid),
  findOrCreate: (userData) => userProvider.findOrCreate(userData),
  setRole: (uid, role) => userProvider.setRole(uid, role),
  updateUserBusinessId: (body) => userProvider.updateUserBusinessId(body),
};

export default userRepository;
