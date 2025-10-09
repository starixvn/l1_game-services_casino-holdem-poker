export default {
  hostingPort: 5000,
  apiSettings: {
    enabledApi: true,
    apiUrl: 'http://l1_game_api_AWS:5000',
    authUrl: 'http://l1_auth_api_AWS:5000',
    client: {
      id: 'game-server',
      secret: 'gameserver@20luminet&',
    },
    useAuthenticate: true,
    placeBetTimeout: 4000,
    requestTimeout: 10000, // 10s
    enabledApiLogs: true,
  },
  authenticateSettings: {
    url: 'http://l1_auth_api_AWS:5000',
    id: 'game-services',
    secret: 'gameservices@20luminet&',
    requestTimeout: 10000,
    useAuthenticate: true,
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
    url: 'mongodb://lmn_backend:Sb%7B5r%40Xy4X%256%28%24%5Bt%252HsOxJ%7CQt9jdR%26t@10.99.99.56:27101/?replicaSet=L1_SabaAWS&appName=CasinoHoldemPoker',
    options: {
      dbName: 'minigame',
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  sentry: {
    sentryUrl: 'http://58fc00e79ab34a3bab04a79038760cb8@sentry.sabagame.com/8',
    logIdentifier: 'casino-holdem-poker',
    env: 'AWS',
  },
  adminSecretKey: 'asWDEer4yGdgsdqR4uqmKQZgh',
  metrics: {
    enable: true,
    secretKey: '6c1f0f28-70f2-46ae-b031-22624a6cd8df',
  },
  roundMaxDurationInMinutes: 5,
};
