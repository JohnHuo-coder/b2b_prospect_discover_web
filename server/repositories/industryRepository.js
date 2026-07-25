import industryProvider from '../providers/industryProvider.js';

const industryRepository = {
  searchIndustries: (search) => industryProvider.searchIndustries(search),
  validateIndustrySelections: (industries, industry_ids) =>
    industryProvider.validateIndustrySelections(industries, industry_ids),
};

export default industryRepository;
