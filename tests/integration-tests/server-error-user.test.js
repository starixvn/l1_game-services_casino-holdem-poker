import { GameClientDriver, internalServerErrorUser } from "sc-game-service-integration-utils";
import { socketOptions } from "./stubs/test-data";
import { initUserSession, JEST_ASSERT_WAITING_RESPONSE_TIMEOUT } from "./init-user-helper";

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

    it("should return error when get internal server error from api", async (done) => {
        // Arrange
        gameClientDriver = new GameClientDriver(socketOptions, initUserSession(internalServerErrorUser));

        gameClientDriver.handleSignedInEvent(async () => {
            await gameClientDriver.sendInGameEvent();

            // Act
            gameClientDriver.socket.emit("bet", {
                deal: {
                    ante: 10
                }
            });

            // Assert
            await gameClientDriver.handleEndBetEvent((endBetData) => {
                if (endBetData.endBet == -1) {
                    expect(endBetData.betChoice).toEqual("deal");
                    expect(endBetData.apiError.errorCode).toEqual("SB1900");
                    expect(endBetData.apiError.isPlaceBetFailed).toEqual(true);
                    done();
                }
            });
        });
    });
});