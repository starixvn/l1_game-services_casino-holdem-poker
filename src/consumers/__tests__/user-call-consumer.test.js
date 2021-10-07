import { Core, Table } from 'sc-game-base';
import BaseCallConsumer from '../base-call-consumer';
import BasePlaceBetConsumer from '../base-place-bet-consumer';
import UserCallConsumer from '../user-call-consumer';
import gameSettings from '../../game-settings';

describe('UserCallConsumer test', () => {
  const definition = new Core.GameDefinition({ id: 1, name: 'casino-holdem-poker' });
  const gameData = new Table.TableGameData();
  const publisher = {};
  const logService = {};
  const keys = {
    maxBetChoice: 'maxBetChoice',
    maxBet: 'maxBet',
    cannotProcessBet: 'cannotProcessBet',
  };

  it('inherit BaseCallConsumer', () => {
    // Act
    const consumer = new UserCallConsumer(definition, gameData, publisher, logService);

    // Assert
    expect(consumer instanceof BaseCallConsumer);
  });

  describe('composeActionValidationCriteria', () => {
    const player = { profile: { name: 'a' }, session: { currency: 'IN', language: 'en' } };
    const expected = [
      {
        failure: true,
        notice: keys.maxBetChoice,
      },
      {
        failure: false,
        notice: keys.maxBet,
      },
    ];
    beforeEach(() => {
      BaseCallConsumer.prototype.composeActionValidationCriteria = jest
        .fn()
        .mockReturnValue(expected);
    });
    it('should return expected when have betTracks', async () => {
      // Arrange
      const data = { ingame: { [player.profile.name]: { betTracks: { bets: { ante: 500 } } } } };
      const consumer = new UserCallConsumer(definition, data, publisher, logService);

      // Act
      const actual = await consumer.composeActionValidationCriteria(player, {});

      // Assert
      expect(BaseCallConsumer.prototype.composeActionValidationCriteria).toHaveBeenCalledWith(
        player,
        500,
      );
      expect(actual).toStrictEqual(expected);
    });

    it('should return expected when empty betTracks', async () => {
      // Arrange
      const data = { ingame: {} };
      const consumer = new UserCallConsumer(definition, data, publisher, logService);

      // Act
      const actual = await consumer.composeActionValidationCriteria(player, {});

      // Assert
      expect(BaseCallConsumer.prototype.composeActionValidationCriteria).toHaveBeenCalledWith(
        player,
        0,
      );
      expect(actual).toStrictEqual(expected);
    });
  });

  describe('consume', () => {
    beforeAll(() => {
      BasePlaceBetConsumer.prototype.consume = jest.fn();
    });
    it('should run correctly', async () => {
      // Arrange
      const consumer = new UserCallConsumer(definition, gameData, publisher, logService);
      const player = { UID: 1 };

      // Act
      await consumer.consume(player, {});

      // Assert
      expect(BasePlaceBetConsumer.prototype.consume).toHaveBeenCalledWith(
        player,
        {},
        { action: gameSettings.actions.call },
      );
    });
  });
});
