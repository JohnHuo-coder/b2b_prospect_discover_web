import pgProvider from '../providers/pgProvider.js';

const provider = pgProvider;

const humanReviewRepository = {
    updateEmailClassificationStatus: (id) => provider.updateEmailClassificationStatus(id),
    updateComplianceCheckStatus: (id) => provider.updateComplianceCheckStatus(id)
};

export default humanReviewRepository;