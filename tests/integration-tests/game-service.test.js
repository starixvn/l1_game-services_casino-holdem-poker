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
