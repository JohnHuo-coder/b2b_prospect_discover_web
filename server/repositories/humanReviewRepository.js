import humanReviewProvider from '../providers/humanReviewProvider.js';

const humanReviewRepository = {
  getComplianceCheckAll: (opts) => humanReviewProvider.getComlianceCheckAll(opts),
  getComplianceCheckDetail: (opts) =>
    humanReviewProvider.getComlianceCheckDetail(opts),
  getFactsByReq: (opts) => humanReviewProvider.getFactsByReq(opts),
  deleteComplianceCheckRecord: (opts) =>
    humanReviewProvider.deleteComlianceCheckRecord(opts),
  getEmailClassificationAll: (opts) =>
    humanReviewProvider.getEmailClassificationAll(opts),
  getEmailClassificationDetail: (opts) =>
    humanReviewProvider.getEmailClassificationDetail(opts),
};

export default humanReviewRepository;
