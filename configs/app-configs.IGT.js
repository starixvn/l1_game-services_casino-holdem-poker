export default {
  hostingPort: 8036,
  apiSettings: {
    enabledApi: true,
    apiUrl: 'http://l1_game_api_local:5000',
    authUrl: 'http://l1_auth_api_local:5000',
    client: {
      id: 'game-server',
      secret: 'gameserver@20luminet&',
    },
    useAuthenticate: false,
    requestTimeout: 10000,
    placeBetTimeout: 4000,
    enabledApiLogs: true,
  },
  authenticateSettings: {
    url: 'http://l1_auth_api_local:5000',
    id: 'game-services',
    secret: 'gameservices@20luminet&',
    requestTimeout: 10000,
    useAuthenticate: false,
    audiences: ['api', 'admin-api'],
  },
  userServiceSettings: {
    url: 'http://localhost:8004/api',
  },
  socketOptions: {
    pingInterval: 60 * 1000,
    pingTimeout: 60 * 1000,
    transports: ['websocket'],
    allowUpgrades: false,
    perMessageDeflate: false,
  },
  enabledLogs: true,
  database: {
    url: 'mongodb://mongo:27017',
    options: {
      dbName: 'game-service-test-db',
      useNewUrlParser: true,
      useUnifiedTopology: true,
      auto_reconnect: true,
    },
  },
  sentry: {
    sentryUrl: '',
    logIdentifier: 'casino-holdem-poker',
    env: 'DEV',
  },
  adminSecretKey: 'asWDEerfOIdgsdqRTFabvmgh',
  metrics: {
    enable: true,
    secretKey: '6c1f0f28-70f2-46ae-b031-22624a6cd8df',
  },
};
