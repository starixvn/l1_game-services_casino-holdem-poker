export default {
    hostingPort: 5000,
    apiSettings: {
        enabledApi: true,
        apiUrl: "http://l2_game_api_AWS:5000",
        authUrl: "http://l2_auth_api_AWS:5000",
        client: {
            id: "game-server",
            secret: "gameserver@20luminet&",
        },
        useAuthenticate: true,
        placeBetTimeout: 4500,
        requestTimeout: 10000, // 10s
        enabledApiLogs: true,
    },
    mainServerApiSettings: {
        url: "http://l2_games_server_AWS:5000/api",
        auth: {
            url: "http://l2_auth_api_AWS:5000",
            id: "game-services",
            secret: "gameservices@20luminet&",
        },
        requestTimeout: 10000,
        useAuthenticate: true,
    },
    socketOptions: {
        pingInterval: 60 * 1000,
        pingTimeout: 60 * 1000,
        transports: ["websocket"],
        allowUpgrades: false,
        perMessageDeflate: false,
    },
    enabledLogs: true,
    database: {
        url: "mongodb://lmn_backend:ilthODrRz8C4s2%5D%7B%7CLV%3Du%5D2vsf6o%5Ex0m@10.99.99.56:37101/?replicaSet=L2_Sabaaws",
        options: {
            dbName: "minigame",
            useNewUrlParser: true,
            useUnifiedTopology: true,
            auto_reconnect: true,
        },
    },
    sentry: {
        sentryUrl: "http://b3f44a40c9ca4d7c96d59da86f37e9b7@10.99.99.187:803/107",
        logIdentifier: "casino-holdem-poker",
        env: "AWS",
    },
    authenticateSettings: {
        audiences: ["api", "admin-api"],
    },
    adminSecretKey: "asWDEer4yGdgsdqR4uqmKQZgh",
    enableCorsWs: true,
    corsUrls: ["https://sc2-games.sportsfun.app", "https://sc2-adm.sportsfun.app"],
    metrics: {
        enable: true,
        secretKey: "6c1f0f28-70f2-46ae-b031-22624a6cd8df",
    },
    roundMaxDurationInMinutes: 1440,
};
