import { errorUser, GameClientDriver, internalServerErrorUser, normalUser } from "sc-game-service-integration-utils";
import { currencyData, socketOptions } from "./stubs/test-data";

const JEST_ASSERT_WAITING_RESPONSE_TIMEOUT = 10000;
const WAITING_END_GAME_TIMEOUT = 6000;
let gameClientDriver;

describe("Casino Casino Holdem Service", () => {
    beforeAll(() => {
        // set timeout for jest, waiting for socket response
        jest.setTimeout(JEST_ASSERT_WAITING_RESPONSE_TIMEOUT);
    });

    afterAll(() => {
        gameClientDriver.close();
        jest.clearAllTimers();
    });

    describe("Happy Path Cases", () => {
        beforeAll(() => {
            // Arrange
            gameClientDriver = new GameClientDriver(socketOptions, initUserSession(normalUser));
        });

        it("should start and allow game client connect to.", (done) => {
            // Assert
            gameClientDriver.handleSignedInEvent(() => {
                done();
            });
        });

        it("should return user information when user joins game.", (done) => {
            // Arrange
            const expectedUser = {
                UID: 1,
                avatarId: 1,
                currency: "$US",
                name: "NormalUser",
                rate: 1,
                red: 25000,
            };

            // Act
            gameClientDriver.sendInGameEvent();

            // Assert
            gameClientDriver.handleInGameEvent((inGameData) => {
                if (inGameData?.user?.UID) {
                    expect(inGameData.user).toStrictEqual(expectedUser);

                    done();
                }
            });
        });

        it("should return game configuration (odds, min bet, max bet) when user joins game.", (done) => {
            // Arrange
            const expectedGameConfigs = {
                minBet: 1,
                maxBet: 3000,
                maxBetPerChoices: {
                    "anteBet": 600,
                    "aaBet": 200,
                    "callBet": 1200
                },
                odds: {
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

            // Act
            gameClientDriver.sendInGameEvent();

            // Assert
            gameClientDriver.handleInGameEvent((inGameData) => {
                if (inGameData?.gameConfigs) {
                    if (inGameData.gameConfigs) {
                        expect(inGameData.gameConfigs.minBet).toEqual(expectedGameConfigs.minBet);
                        expect(inGameData.gameConfigs.maxBet).toEqual(expectedGameConfigs.maxBet);
                        expect(inGameData.gameConfigs.maxBetPerChoices).toStrictEqual(expectedGameConfigs.maxBetPerChoices);
                        expect(inGameData.gameConfigs.odds).toStrictEqual(expectedGameConfigs.odds);

                        done();
                    }
                }
            });
        });

        it("should return current user ticket result when user is playing game.", (done) => {
            // Arrange
            const expectedEndBetResponse = {
                deal: {
                    choices: {
                        ante: 10,
                        aa: 0
                    }
                },
                user: { maxBet: 2000, minBet: 1, red: 24250, scoins: 0 },
            };

            // Act
            gameClientDriver.socket.emit("bet", {
                deal: {
                    ante: 10
                }
            });

            // Assert
            gameClientDriver.handleEndBetEvent((endBetData) => {
                if (endBetData.endBet) {
                    expect(endBetData.deal.choices).toEqual(expectedEndBetResponse.deal.choices);
                    expect(endBetData.deal.combinationResult.player.cards.length).toEqual(5);
                    expect(endBetData.deal.player.length).toEqual(2);
                    expect(endBetData.deal.totalAmount).toEqual(10);
                    expect(endBetData.user).toEqual(expectedEndBetResponse.user);

                    done();
                }
            });
        });
    });
});

const initUserSession = (user) => {
    return {
        session: `${user.memberId}-session-id`,
        ss: `${user.memberId}-session-id`,
        currency: currencyData.name,
        username: `${user.memberId}_${user.memberName}`,
        browserUserAgent: "browser-user-agent",
    };
};
