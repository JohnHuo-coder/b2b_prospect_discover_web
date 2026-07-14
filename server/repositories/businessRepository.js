import businessProvider from '../providers/businessProvider.js';
import userProvider from '../providers/userProvider.js';

const businessRepository = {
  createBusiness: (businessData) => businessProvider.createBusiness(businessData),
  deleteByUid: (uid) => businessProvider.deleteBusinessByUid(uid),
  getAllBusinessMember: (bid) => userProvider.getAllBusinessMember(bid),
  getBusinesses: (query) => userProvider.getBusinesses(query),
  getBusinessConfig: (business_id) => businessProvider.getBusinessConfig(business_id),
  insertBusinessConfig: (body) => businessProvider.insertBusinessConfig(body),
  updateCandidatesPerRun: (body) => businessProvider.updateCandidatesPerRun(body),
};

export default businessRepository;
