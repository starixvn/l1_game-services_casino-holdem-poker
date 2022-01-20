const game = {
    id: 39,
    name: 'CasinoHoldemPoker',
};
const currencyData = { code: "USD", name: "$US" };

const socketOptions = {
    socketUri: "http://127.0.0.1:8036/user/casinoholdempoker",
    gameName: game.name,
    proxyRoute: "/socket.io",
};

const gameConfig = {
    type: 0,
    name: "casinoholdempoker",
    minBet: 1,
    maxBet: 3000,
    maxBetPerChoices: {
        "anteBet": 600,
        "aaBet": 200,
        "callBet": 1200
      },
    odds:{
        "CallBet_callBet": 2.5,
        "AnteBet_highCards": 3,
        "AnteBet_onePair": 3,
        "AnteBet_twoPairs": 3,
        "AnteBet_threeKind": 3,
        "AnteBet_straight": 3,
        "AnteBet_flush": 4,
        "AnteBet_fullHouse": 5,
        "AnteBet_fourKind": 12,
        "AnteBet_straightFlush": 22,
        "AnteBet_royalFlush": 102,
        "AABet_pairAces": 9,
        "AABet_twoPairs": 9,
        "AABet_threeKind": 9,
        "AABet_straight": 9,
        "AABet_flush": 22,
        "AABet_fullHouse": 44,
        "AABet_fourKind": 42,
        "AABet_straightFlush": 52,
        "AABet_royalFlush": 102
      }
};

const rounds = [
    {"id":8939,"ended":true,"communityCardsGenerated":[{"rank":5,"suit":1},{"rank":12,"suit":2},{"rank":11,"suit":0},{"rank":2,"suit":1},{"rank":3,"suit":0}],"result":{"dealer":[{"rank":1,"suit":3},{"rank":5,"suit":3}],"communityCards":[{"rank":5,"suit":1},{"rank":12,"suit":2},{"rank":11,"suit":0}]},"uid":"61e542d08faf7dcff24a74c2","name":"West77290","odds":{"CallBet_callBet":2.5,"AnteBet_highCards":3,"AnteBet_onePair":3,"AnteBet_twoPairs":3,"AnteBet_threeKind":3,"AnteBet_straight":3,"AnteBet_flush":4,"AnteBet_fullHouse":5,"AnteBet_fourKind":12,"AnteBet_straightFlush":22,"AnteBet_royalFlush":102,"AABet_pairAces":9,"AABet_twoPairs":9,"AABet_threeKind":9,"AABet_straight":9,"AABet_flush":22,"AABet_fullHouse":44,"AABet_fourKind":42,"AABet_straightFlush":52,"AABet_royalFlush":102},"md5":"aa7e2cefe609d8ddd66a07a2d4ad9de1","resultKeyRaw":"[4, 9, 2, 6, 6, K, Q, 3, 4]0121f666c00dab3b84c0a2","exchangeRateId":1271},
    {"id":1325,"ended":true,"communityCardsGenerated":[{"rank":1,"suit":1},{"rank":5,"suit":0},{"rank":7,"suit":3},{"rank":9,"suit":0},{"rank":1,"suit":3}],"result":{"dealer":[{"rank":9,"suit":1},{"rank":2,"suit":0}],"communityCards":[{"rank":1,"suit":1},{"rank":5,"suit":0},{"rank":7,"suit":3},{"rank":9,"suit":0},{"rank":1,"suit":3}]},"uid":"61d4fcbe71f39a746385a8a0","name":"nitin123","odds":{"CallBet_callBet":2,"AnteBet_highCards":2,"AnteBet_onePair":2,"AnteBet_twoPairs":2,"AnteBet_threeKind":2,"AnteBet_straight":2,"AnteBet_flush":3,"AnteBet_fullHouse":4,"AnteBet_fourKind":11,"AnteBet_straightFlush":21,"AnteBet_royalFlush":101,"AABet_pairAces":8,"AABet_twoPairs":8,"AABet_threeKind":8,"AABet_straight":8,"AABet_flush":21,"AABet_fullHouse":31,"AABet_fourKind":41,"AABet_straightFlush":51,"AABet_royalFlush":101},"md5":"11571721c57ee44e11879b2d65043fe3","resultKeyRaw":"[0, 0, 9, 2, 1, 5, 7, 9, 1]b9b4c20af90ee82c40ef35","exchangeRateId":1130,"settlementResult":{"id":3,"combinationCards":[{"rank":9,"suit":1},{"rank":9,"suit":0},{"rank":1,"suit":1},{"rank":1,"suit":3}],"cards":[{"rank":9,"suit":1},{"rank":9,"suit":0},{"rank":1,"suit":1},{"rank":1,"suit":3},{"rank":7,"suit":3}],"isQualified":true}}
];

export { game, currencyData, socketOptions, gameConfig, rounds };
