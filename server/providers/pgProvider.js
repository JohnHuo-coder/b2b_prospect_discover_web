import userProvider from './userProvider.js';
import businessProvider from './businessProvider.js';
import leadProvider from './leadProvider.js';
import dashboardProvider from './dashboardProvider.js';
import systemDashboardProvider from './systemDashboardProvider.js';

/** @deprecated Import domain-specific providers directly. */
export default {
  ...userProvider,
  ...businessProvider,
  ...leadProvider,
  ...dashboardProvider,
  ...systemDashboardProvider,
};
