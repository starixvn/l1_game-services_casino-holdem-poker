export default {
  hostingPort: 5000,
  apiSettings: {
    enabledApi: true,
    apiUrl: 'http://l1_game_api_local_3:5000',
    authUrl: 'http://l1_auth_api_local_3:5000',
    client: {
      id: 'game-server',
      secret: 'gameserver@20luminet&',
    },
    useAuthenticate: true,
    requestTimeout: 10000,
    placeBetTimeout: 4500,
    enabledApiLogs: true,
  },
  mainServerApiSettings: {
    url: 'http://l1_game_server_local_3:5000/api',
    auth: {
      url: 'http://l1_auth_api_local_3:5000',
      id: 'game-services',
      secret: 'gameservices@20luminet&',
    },
    requestTimeout: 10000,
    placeBetTimeout: 4500,
    useAuthenticate: true,
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
    url: 'mongodb://lmn_backend:LmnBackend@10.10.50.14:27106/?replicaSet=L1pppLocal',
    options: {
      dbName: 'minigame',
      useNewUrlParser: true,
      useUnifiedTopology: true,
      auto_reconnect: true,
    },
  },
  sentry: {
    sentryUrl: 'https://13f39b8359404ed5aec23655e64ccf78@sentry.lumigame.com/2',
    logIdentifier: 'casino-holdem-poker',
    env: 'LOCAL-3',
  },
  authenticateSettings: {
    audiences: ['api', 'admin-api'],
  },
  adminSecretKey: 'asWDEerfOIdgsdqRTFabvmgh',
  enableCorsWs: false,
  corsUrls: [
    'https://localhost:7456',
    'https://localhost:7000',
    'https://l1-games3.lumigame.com',
    'https://l1-admin3.lumigame.com',
  ],
  metrics: {
    enable: true,
    secretKey: '6c1f0f28-70f2-46ae-b031-22624a6cd8df',
  },
  roundMaxDurationInMinutes: 5,
};
