export default {
  hostingPort: 5000,
  apiSettings: {
    enabledApi: true,
    apiUrl: 'http://l1_game_api_sit:5000',
    authUrl: 'http://l1_auth_api_sit:5000',
    client: {
      id: 'game-server',
      secret: 'gameserver@20luminet&',
    },
    useAuthenticate: true,
    requestTimeout: 10000,
    placeBetTimeout: 4500,
    enabledApiLogs: true,
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
    url: 'mongodb://lmn_backend:LmnBackend%40517@10.99.99.187:27301/?replicaSet=SabaSIT',
    options: {
      dbName: 'minigame',
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  sentry: {
    sentryUrl: 'http://52368c4019044019885440599c180bda@10.2.190.51:9009/24',
    logIdentifier: 'casino-holdem-poker',
    env: 'SIT',
  },
  authenticateSettings: {
    audiences: ['api', 'admin-api'],
  },
  adminSecretKey: 'asWDEerfOIdgsdqRTFabvmgh',
  enableCorsWs: true,
  corsUrls: [
    'http://localhost:7456',
    'http://sit.sabagame.com',
    'https://sit.sabagame.com',
    'https://sit-admg.sabagame.com',
    'http://sit-adm.sabagame.com',
    'https://sit-adm.sabagame.com',
    'http://sitm.sabagame.com',
    'https://sitm.sabagame.com',
  ],
  metrics: {
    enable: true,
    secretKey: '6c1f0f28-70f2-46ae-b031-22624a6cd8df',
  },
  roundMaxDurationInMinutes: 60,
  enableMsgpackParser: true,
};
