import appConfigs from './app-configs';

export default Object.assign(appConfigs, {
  authenticateSettings: {
    url: 'http://l1-auth-api-local-service:5000',
    id: 'game-services',
    secret: 'gameservices@20luminet&',
    requestTimeout: 3000,
    useAuthenticate: false,
    audiences: ['api', 'admin-api'],
  },
  userServiceSettings: {
    url: 'http://l1-user-service-local-service:5000',
  },
  database: {
    url: 'mongodb://localhost:27017',
    options: {
      dbName: 'game-service-test-db',
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
});
