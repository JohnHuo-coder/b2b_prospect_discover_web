import businessProvider from '../providers/businessProvider.js';
import userProvider from '../providers/userProvider.js';

const businessRepository = {
  createBusiness: (businessData) => businessProvider.createBusiness(businessData),
  deleteByUid: (uid) => businessProvider.deleteBusinessByUid(uid),
  getAllBusinessMember: (bid) => userProvider.getAllBusinessMember(bid),
  getBusinesses: (query) => userProvider.getBusinesses(query),
  getBusinessConfig: (business_id) => businessProvider.getBusinessConfig(business_id),
  upsertBusinessProfile: (body) => businessProvider.upsertBusinessProfile(body),
  upsertClassificationCutoffs: (body) =>
    businessProvider.upsertClassificationCutoffs(body),
  upsertSearchConfig: (body) => businessProvider.upsertSearchConfig(body),
  upsertRunSettings: (body) => businessProvider.upsertRunSettings(body),
  upsertContactFilters: (body) => businessProvider.upsertContactFilters(body),
  upsertRequirements: (body) => businessProvider.upsertRequirements(body),
};

export default businessRepository;
