export default {
  hostingPort: 5000,
  apiSettings: {
    enabledApi: true,
    apiUrl: 'http://l2_game_api_AWS:5000',
    authUrl: 'http://l2_auth_api_AWS:5000',
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
    url: 'http://l2_auth_api_aws:5000',
    id: 'game-services',
    secret: 'gameservices@20luminet&',
    requestTimeout: 10000,
    useAuthenticate: true,
    audiences: ['api', 'admin-api'],
  },
  userServiceSettings: {
    url: 'http://l2_user_service_aws:5000',
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
    url: 'mongodb://lmn_backend:ilthODrRz8C4s2%5D%7B%7CLV%3Du%5D2vsf6o%5Ex0m@10.99.99.56:37101/?replicaSet=L2_Sabaaws&appName=CasinoHoldemPoker',
    options: {
      dbName: 'minigame',
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  sentry: {
    sentryUrl: 'http://b3f44a40c9ca4d7c96d59da86f37e9b7@10.99.99.187:803/107',
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
