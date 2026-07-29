import requestProvider from '../providers/requestProvider.js';

const requestRepository = {
  createAccessRequest: (body) => requestProvider.createAccessRequest(body),
  hasAccessRequest: (user_id) => requestProvider.hasAccessRequest(user_id),
};

export default requestRepository;
