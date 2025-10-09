export default {
  hostingPort: 5000,
  apiSettings: {
    enabledApi: true,
    apiUrl: 'http://l2-game-api-local2-service:5000',
    authUrl: 'http://l2-auth-api-local2-service:5000',
    client: {
      id: 'game-server',
      secret: 'gameserver@20luminet&',
    },
    useAuthenticate: true,
    requestTimeout: 10000,
    placeBetTimeout: 4000,
    enabledApiLogs: true,
  },
  authenticateSettings: {
    url: 'http://l2-auth-api-local2-service:5000',
    id: 'game-services',
    secret: 'gameservices@20luminet&',
    requestTimeout: 10000,
    useAuthenticate: true,
    audiences: ['api', 'admin-api'],
  },
  userServiceSettings: {
    url: 'http://l2-user-service-local2-service:5000',
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
    url: 'mongodb://lmn_backend:LmnBackend@10.10.50.12:39202,10.10.50.13:39202,10.10.50.14:39202/?replicaSet=L2ppLocal&appName=CasinoHoldemPoker',
    options: {
      dbName: 'minigame',
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  sentry: {
    sentryUrl: 'https://13f39b8359404ed5aec23655e64ccf78@sentry.lumigame.com/2',
    logIdentifier: 'casino-holdem-poker',
    env: 'LOCAL_2',
  },
  adminSecretKey: 'asWDEerfOIdgsdqRTFabvmgh',
  metrics: {
    enable: true,
    secretKey: '6c1f0f28-70f2-46ae-b031-22624a6cd8df',
  },
  roundMaxDurationInMinutes: 1440,
};
