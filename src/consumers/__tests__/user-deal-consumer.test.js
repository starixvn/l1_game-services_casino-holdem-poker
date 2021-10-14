import { Core, Table } from 'sc-game-base';
import BasePlaceBetConsumer from '../base-place-bet-consumer';
import UserDealConsumer from '../user-deal-consumer';
import gameSettings from '../../game-settings';

jest.mock('sc-common', () => {
  return {
    helpers: { numberHelper: { formatNumberWithComma: jest.fn((number) => number) } },
  };
});

describe('UserDealConsumer test', () => {
  const definition = new Core.GameDefinition({ id: 1, name: 'casino-holdem-poker' });
  const gameData = new Table.TableGameData();
  const publisher = {};
  const logService = {};
  const keys = {
    maxBetChoice: 'maxBetChoice',
    maxBet: 'maxBet',
    minBet: 'minBet',
    invalidDealDueToRunningRound: 'invalidDealDueToRunningRound',
    placeBetIsProcessingMessage: 'placeBetIsProcessingMessage',
  };

  it('inherit BasePlaceBetConsumer', () => {
    // Act
    const consumer = new UserDealConsumer(definition, gameData, publisher, logService);

    // Assert
    expect(consumer instanceof BasePlaceBetConsumer);
  });

  describe('composeActionValidationCriteria', () => {
    const configs = {
      maxBetChoices: { anteBet: 100, aaBet: 100 },
      maxBet: 1000,
      minBet: 100,
    };
    const player = { profile: { name: 'a' }, session: { currency: 'IN', language: 'en' } };
    const expected = [
      {
        failure: false,
        notice: keys.maxBetChoice,
      },
      {
        failure: false,
        notice: keys.maxBetChoice,
      },
      {
        failure: true,
        notice: keys.minBet,
      },
      {
        failure: false,
        notice: keys.maxBet,
      },
    ];

    it('should return expected', async () => {
      // Arrange
      const consumer = new UserDealConsumer(definition, gameData, publisher, logService);

      // Act
      const actual = await consumer.composeActionValidationCriteria(player, { ante: 10, aa: 10 });

      // Assert
      expect(actual).toStrictEqual(expected);
    });

    it('should return expected', async () => {
      // Arrange
      const consumer = new UserDealConsumer(definition, gameData, publisher, logService);

      // Act
      const actual = await consumer.composeActionValidationCriteria(player, { ante: 100, aa: 10 });

      // Assert
      expect(actual).toStrictEqual(expected);
    });
  });

  describe('composeBettingTimeValidationCriteria', () => {
    const player = { profile: { name: 'a' }, session: { currency: 'IN', language: 'en' } };
    beforeEach(() => {
      BasePlaceBetConsumer.prototype.composeBettingTimeValidationCriteria = jest
        .fn()
        .mockReturnValue([]);
    });
    it('should return expected when empty ingame', async () => {
      // Arrange
      const data = { ingame: {} };
      const consumer = new UserDealConsumer(definition, data, publisher, logService);
      const expected = [
        {
          failure: false,
          notice: keys.invalidDealDueToRunningRound,
        },
        { failure: false, notice: keys.placeBetIsProcessingMessage },
      ];

      // Act
      const actual = await consumer.composeBettingTimeValidationCriteria(player);

      // Assert
      expect(actual).toStrictEqual(expected);
    });

    it('should return expected when have ingame', async () => {
      // Arrange
      const data = { ingame: { [player.profile.name]: { betTracks: { roundId: 1 } } } };
      const consumer = new UserDealConsumer(definition, data, publisher, logService);
      const expected = [
        {
          failure: true,
          notice: keys.invalidDealDueToRunningRound,
        },
        { failure: false, notice: keys.placeBetIsProcessingMessage },
      ];

      // Act
      const actual = await consumer.composeBettingTimeValidationCriteria(player);

      // Assert
      expect(actual).toStrictEqual(expected);
    });
  });

  describe('consume', () => {
    beforeAll(() => {
      BasePlaceBetConsumer.prototype.consume = jest.fn();
    });
    it('should run correctly', async () => {
      // Arrange
      const consumer = new UserDealConsumer(definition, gameData, publisher, logService);
      const player = { UID: 1 };

      // Act
      await consumer.consume(player, {});

      // Assert
      expect(BasePlaceBetConsumer.prototype.consume).toHaveBeenCalledWith(
        player,
        { aa: 0, ante: 0 },
        {
          action: gameSettings.actions.deal,
          payload: { ante: 0, aa: 0 },
        },
      );
    });
  });
});
