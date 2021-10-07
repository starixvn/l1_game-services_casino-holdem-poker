import { Core, Table } from 'sc-game-base';
import { gameNotifications } from 'sc-base-database';
import UserDisconnectConsumer from '../user-disconnect-consumer';
import BaseUserDisconnectConsumer from 'sc-game-base/src/core/event-consumers/user-disconnect-consumer';

jest.mock('sc-base-database', () => {
  return {
    gameNotifications: {
      updateOne: jest.fn().mockReturnValue({
        exec: jest.fn(),
      }),
    },
  };
});

describe('UserDisconnectConsumer test', () => {
  it('inherit BaseUserDisconnectConsumer', () => {
    // Act
    const consumer = new UserDisconnectConsumer();

    // Assert
    expect(consumer instanceof BaseUserDisconnectConsumer);
  });

  describe('consume', () => {
    beforeEach(() => {
      BaseUserDisconnectConsumer.prototype.consume = jest.fn();
    });
    it('should run correctly when have realPlayer', async () => {
      // Arrange
      const consumer = new UserDisconnectConsumer();
      const socketClient = { id: 1 };
      consumer.gameData = { realPlayers: { [socketClient.id]: { UID: 2 } }, players: { [2]: {} } };
      consumer.updateRunningRound = jest.fn();

      // Act
      await consumer.consume(socketClient);

      // Assert
      expect(consumer.gameData.players['2']).toBeUndefined();
      expect(consumer.updateRunningRound).toHaveBeenCalledWith(
        consumer.gameData.realPlayers[socketClient.id],
      );
      expect(BaseUserDisconnectConsumer.prototype.consume).toHaveBeenCalledWith(socketClient);
    });

    it('should run correctly when empty realPlayer', async () => {
      // Arrange
      const consumer = new UserDisconnectConsumer();
      const socketClient = { id: 1 };
      consumer.gameData = { realPlayers: {} };
      consumer.updateRunningRound = jest.fn();

      // Act
      await consumer.consume(socketClient);

      // Assert
      expect(consumer.updateRunningRound).not.toHaveBeenCalled();
      expect(BaseUserDisconnectConsumer.prototype.consume).toHaveBeenCalledWith(socketClient);
    });
  });

  describe('updateRunningRound', () => {
    it('should run correctly when empty betTracks', async () => {
      // Arrange
      const consumer = new UserDisconnectConsumer();
      consumer.definition = { id: 1 };
      const player = { UID: 2, profile: { name: 'a' } };
      consumer.gameData = { ingame: {} };

      // Act
      await consumer.updateRunningRound(player);

      // Assert
      expect(gameNotifications.updateOne).not.toHaveBeenCalled();
    });

    it('should run correctly when have betTracks', async () => {
      // Arrange
      const consumer = new UserDisconnectConsumer();
      consumer.definition = { id: 1 };
      const player = { UID: 2, profile: { name: 'a' } };
      consumer.gameData = {
        ingame: { [player.profile.name]: { betTracks: { roundId: 1, roundStartTime: 123 } } },
      };
      const gameInfo = {
        uid: player.UID,
        gameId: consumer.definition.id,
        gameInfo: { roundId: 1, roundStartTime: 123 },
      };

      // Act
      await consumer.updateRunningRound(player);

      // Assert
      expect(gameNotifications.updateOne).toHaveBeenCalledWith(
        { uid: player.UID, gameId: consumer.definition.id },
        { $setOnInsert: gameInfo },
        { upsert: true, setDefaultsOnInsert: true },
      );
    });
  });
});
