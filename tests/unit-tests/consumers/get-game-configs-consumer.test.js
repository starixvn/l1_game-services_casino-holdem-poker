import { Table } from "sc-game-base";
import GetGameConfigsConsumer from "../../../src/consumers/get-game-configs-consumer";

describe("#get-game-configs-consumer", () => {
  // arrange
  const definition = new Table.TableGameDefinition({ id: 1, name: "game-name" });
  const gameData = new Table.TableGameData();

  const consumer = new GetGameConfigsConsumer({ definition, gameData });

  describe("#consume", () => {
    it("should emit event with correct result", async () => {
      // arrange
      const player = {
        session: { currency: "UUS", language: "en-US" },
        socketClient: {
          emit: jest.fn(),
        },
      };

      // act
      await consumer.consume(player);

      //assert
      expect(player.socketClient.emit).toBeCalledWith(expect.anything(), expect.anything());
    });
  });
});
