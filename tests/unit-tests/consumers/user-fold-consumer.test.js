import { Core, Table } from 'sc-game-base';
import BasePlaceBetConsumer from '../../../src/consumers/base-place-bet-consumer';
import BaseCallConsumer from '../../../src/consumers/base-call-consumer';
import UserFoldConsumer from '../../../src/consumers/user-fold-consumer';
import gameSettings from '../../../src/game-settings';

describe('UserFoldConsumer test', () => {
  const definition = new Core.GameDefinition({ id: 1, name: 'casino-holdem-poker' });
  const gameData = new Table.TableGameData();
  const publisher = {};
  const logService = { logWarning: jest.fn() };

  it('inherit BaseCallConsumer', () => {
    // Act
    const consumer = new UserFoldConsumer(definition, gameData, publisher, logService);

    // Assert
    expect(consumer instanceof BaseCallConsumer);
  });

  describe('composeActionValidationCriteria', () => {
    it('should return empty array', async () => {
      // Arrange
      const consumer = new UserFoldConsumer(definition, gameData, publisher, logService);
      const player = { UID: 1 };

      // Act
      const actual = await consumer.composeActionValidationCriteria(player, {});

      // Assert
      expect(actual).toBeArrayOfSize(0);
    });
  });

  describe('consume', () => {
    beforeAll(() => {
      BasePlaceBetConsumer.prototype.consume = jest.fn();
    });
    it('should run correctly', async () => {
      // Arrange
      const consumer = new UserFoldConsumer(definition, gameData, publisher, logService);
      const player = { UID: 1 };

      // Act
      await consumer.consume(player, {});

      // Assert
      expect(BasePlaceBetConsumer.prototype.consume).toHaveBeenCalledWith(
        player,
        {},
        {
          action: gameSettings.actions.fold,
        },
      );
    });
  });
});
