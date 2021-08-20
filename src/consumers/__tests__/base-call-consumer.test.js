import { Core, Table } from 'sc-game-base';
import BasePlaceBetConsumer from '../base-place-bet-consumer';
import BaseCallConsumer from '../base-call-consumer';
import gameSettings from '../../game-settings';
import Translation from '@nex3/translation';
import MarketManagement from '@nex3/market-management';

jest.mock('sc-common', () => {
  return {
    helpers: { numberHelper: { formatNumberWithComma: jest.fn((number) => number) } },
  };
});
jest.mock('../../resources/translation/languages', () => {
  return {
    loadLanguage: jest.fn().mockReturnValue({}),
  };
});
jest.mock('@nex3/translation');
jest.mock('@nex3/market-management');

describe('BaseCallConsumer test', () => {
  const definition = new Core.GameDefinition({ id: 1, name: 'casino-holdem-poker' });
  const gameData = new Table.TableGameData();
  const publisher = {};
  const logService = { logWarning: jest.fn() };
  const keys = {
    maxBetChoice: 'maxBetChoice',
    maxBet: 'maxBet',
    cannotProcessBet: 'cannotProcessBet',
  };

  beforeAll(() => {
    Translation.getInstance = jest.fn().mockReturnValue({
      t: jest.fn((key, b) => key),
      keys,
    });
  });

  it('inherit BasePlaceBetConsumer', () => {
    // Act
    const consumer = new BaseCallConsumer(definition, gameData, publisher, logService);

    // Assert
    expect(consumer instanceof BasePlaceBetConsumer);
  });

  describe('composeActionValidationCriteria', () => {
    const configs = {
      maxBetChoices: { callBet: 100 },
      maxBet: 1000,
    };
    const player = { profile: { name: 'a' }, session: { currency: 'IN', language: 'en' } };
    beforeAll(() => {
      MarketManagement.getInstance = jest.fn().mockReturnValue({
        getGameMarketConfig: jest.fn().mockReturnValue(configs),
      });
    });
    it('should return expected when amount 500', async () => {
      // Arrange
      const data = { ingame: {} };
      const consumer = new BaseCallConsumer(definition, data, publisher, logService);
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

      // Act
      const actual = await consumer.composeActionValidationCriteria(player, 500);

      // Assert
      expect(actual).toStrictEqual(expected);
    });

    it('should return expected when amount 0', async () => {
      // Arrange
      const data = { ingame: {} };
      const consumer = new BaseCallConsumer(definition, data, publisher, logService);
      const expected = [
        {
          failure: false,
          notice: keys.maxBetChoice,
        },
        {
          failure: false,
          notice: keys.maxBet,
        },
      ];

      // Act
      const actual = await consumer.composeActionValidationCriteria(player, 0);

      // Assert
      expect(actual).toStrictEqual(expected);
    });

    it('should return expected when bet amount greater than maxBet per round', async () => {
      // Arrange
      const data = {
        ingame: { [player.profile.name]: { betTracks: { bets: { ante: 100, aa: 1000 } } } },
      };
      const consumer = new BaseCallConsumer(definition, data, publisher, logService);
      const expected = [
        {
          failure: false,
          notice: keys.maxBetChoice,
        },
        {
          failure: true,
          notice: keys.maxBet,
        },
      ];

      // Act
      const actual = await consumer.composeActionValidationCriteria(player, 100);

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
      const consumer = new BaseCallConsumer(definition, gameData, publisher, logService);
      const expected = [
        {
          failure: true,
          notice: keys.cannotProcessBet,
        },
      ];

      // Act
      const actual = await consumer.composeBettingTimeValidationCriteria(player);

      // Assert
      expect(consumer.logService.logWarning).toHaveBeenCalledWith(
        `player ${player.profile.name} ingame undefined`,
      );
      expect(actual).toStrictEqual(expected);
    });

    it('should return expected when have ingame', async () => {
      // Arrange
      const data = { ingame: { [player.profile.name]: { betTracks: { roundId: 1 } } } };
      const consumer = new BaseCallConsumer(definition, data, publisher, logService);
      const expected = [
        {
          failure: false,
          notice: keys.cannotProcessBet,
        },
      ];

      // Act
      const actual = await consumer.composeBettingTimeValidationCriteria(player);

      // Assert
      expect(actual).toStrictEqual(expected);
    });
  });
});
