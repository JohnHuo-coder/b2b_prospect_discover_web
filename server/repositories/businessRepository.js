import pgProvider from '../providers/pgProvider.js';

const provider = pgProvider;

const businessRepository = {
  createBusiness: (businessData) => provider.createBusiness(businessData),
  deleteByUid: (uid) => provider.deleteBusinessByUid(uid),
  getAllBusinessMember: (bid) => provider.getAllBusinessMember(bid),
  getBusinesses: (query) => provider.getBusinesses(query),

  getBusinessConfig: (business_id) => provider.getBusinessConfig(business_id),
  upsertBusinessProfile: (body) => provider.upsertBusinessProfile(body),
  upsertClassificationCutoffs: (body) => provider.upsertClassificationCutoffs(body),
  upsertSearchConfig: (body) => provider.upsertSearchConfig(body),
  upsertRunSettings: (body) => provider.upsertRunSettings(body),
  upsertContactFilters: (body) => provider.upsertContactFilters(body),
  upsertRequirements: (body) => provider.upsertRequirements(body),
};

export default businessRepository;
