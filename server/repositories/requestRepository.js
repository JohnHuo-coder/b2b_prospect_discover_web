import requestProvider from '../providers/requestProvider.js';

const requestRepository = {
  createAccessRequest: (body) => requestProvider.createAccessRequest(body),
  hasAccessRequest: (user_id) => requestProvider.hasAccessRequest(user_id),
  listAccessRequests: () => requestProvider.listAccessRequests(),
  approveAccessRequest: (requestId) =>
    requestProvider.approveAccessRequest(requestId),
  denyAccessRequest: (requestId) =>
    requestProvider.denyAccessRequest(requestId),
  approveAllActiveAccessRequests: () =>
    requestProvider.approveAllActiveAccessRequests(),
};

export default requestRepository;
