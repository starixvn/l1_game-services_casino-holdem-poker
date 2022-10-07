export default {
  hostingPort: 8036,
  apiSettings: {
    enabledApi: true,
    apiUrl: 'http://localhost:8868',
    authUrl: 'http://localhost:8898',
    client: {
      id: 'game-server',
      secret: 'gameserver@20luminet&',
    },
    useAuthenticate: false,
    requestTimeout: 10000,
    placeBetTimeout: 4000,
    enableApiLogs: true,
  },
  authenticateSettings: {
    url: 'http://auth.lumigame.com',
    id: 'game-services',
    secret: 'gameservices@20luminet&',
    requestTimeout: 10000,
    useAuthenticate: false,
    audiences: ['api', 'admin-api'],
  },
  userServiceSettings: {
    url: 'http://127.0.0.1:5000',
  },
  socketOptions: {
    pingInterval: 60 * 1000,
    pingTimeout: 60 * 1000,
    transports: ['websocket'],
    allowUpgrades: false,
  },
  enabledLogs: true,
  database: {
    url: 'mongodb://127.0.0.1:27017',
    options: {
      dbName: 'minigame2',
      useNewUrlParser: true,
      useUnifiedTopology: true,
      auto_reconnect: true,
    },
  },
  sentry: {
    sentryUrl: 'https://13f39b8359404ed5aec23655e64ccf78@sentry.lumigame.com/2',
    logIdentifier: 'casino-holdem-poker',
    env: 'DEV',
  },
  adminSecretKey: 'asWDEerfOIdgsdqRTFabvmgh',
  enableCorsWs: false,
  corsUrls: [
    'http://localhost:7456',
    'http://10.5.10.14:7456',
    'http://localhost:7000',
    'http://games.lumigame.com',
    'http://admin.lumigame.com',
  ],
  metrics: {
    enable: true,
    secretKey: '6c1f0f28-70f2-46ae-b031-22624a6cd8df',
  },
  roundMaxDurationInMinutes: 5,
};
