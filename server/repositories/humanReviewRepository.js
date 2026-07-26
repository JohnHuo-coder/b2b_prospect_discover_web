import humanReviewProvider from '../providers/humanReviewProvider.js';

const humanReviewRepository = {
  getComplianceCheckAll: (opts) => humanReviewProvider.getComlianceCheckAll(opts),
  getComplianceCheckDetail: (opts) =>
    humanReviewProvider.getComlianceCheckDetail(opts),
  getFactsByReq: (opts) => humanReviewProvider.getFactsByReq(opts),
  updateComplianceCheckDecision: (opts) =>
    humanReviewProvider.updateComplianceCheckDecision(opts),
};

export default humanReviewRepository;
