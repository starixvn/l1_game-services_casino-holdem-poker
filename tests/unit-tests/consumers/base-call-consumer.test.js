import { Core, Table } from 'sc-game-base';
import BasePlaceBetConsumer from '../../../src/consumers/base-place-bet-consumer';
import BaseCallConsumer from '../../../src/consumers/base-call-consumer';
import { helpers } from "sc-common";

describe('BaseCallConsumer test', () => {
  const definition = new Core.GameDefinition({ id: 1, name: 'casino-holdem-poker' });
  const gameData = new Table.TableGameData();
  const publisher = {};
  const logService = { logWarning: jest.fn() };
  const playerName = "nhanvat01";
  const player = {
    UID: "123",
    profile: {
      name: playerName,
      minBet: 1,
      maxBet: 2000,
    },
    session: {
      currencyGroupId: "1",
      currency: "US",
    },
  };

  gameData.remainingTime = 20;
  gameData.gameConfigs = {
    enabled: true
  };
  gameData.currencyGroupGames = [
    {
      groupId: 1,
      minBet: 10,
      maxBet: 1000,
      maxBetPerChoices: { callBet: 100, anteBet: 100, aaBet: 100 }
    },
  ];

  it('inherit BasePlaceBetConsumer', () => {
    // Act
    const consumer = new BaseCallConsumer(definition, gameData, publisher, logService);

    // Assert
    expect(consumer instanceof BasePlaceBetConsumer);
  });

  describe('composeActionValidationCriteria', () => {
    it('should return expected when amount 500', async () => {
      // Arrange
      const data = { ingame: {} };
      const consumer = new BaseCallConsumer(definition, { ...gameData, ...data }, publisher, logService);
      const expected = [
        {
          failure: true,
          notice: { errorCode: helpers.noticeHelper.maxBetForChoice, maxBet: "100" },
        },
        {
          failure: false,
          notice: { errorCode: helpers.noticeHelper.maxBet, maxBet: "1,000" },
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
      const consumer = new BaseCallConsumer(definition, { ...gameData, ...data }, publisher, logService);
      const expected = [
        {
          failure: false,
          notice: { errorCode: helpers.noticeHelper.maxBetForChoice, maxBet: "100" },
        },
        {
          failure: false,
          notice: { errorCode: helpers.noticeHelper.maxBet, maxBet: "1,000" },
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
      const consumer = new BaseCallConsumer(definition, { ...gameData, ...data }, publisher, logService);
      const expected = [
        {
          failure: false,
          notice: { errorCode: helpers.noticeHelper.maxBetForChoice, maxBet: "100" },
        },
        {
          failure: true,
          notice: { errorCode: helpers.noticeHelper.maxBet, maxBet: "1,000" },
        }
      ];

      // Act
      const actual = await consumer.composeActionValidationCriteria(player, 100);

      // Assert
      expect(actual).toStrictEqual(expected);
    });
  });

  describe('composeBettingTimeValidationCriteria', () => {
    beforeEach(() => {
      BasePlaceBetConsumer.prototype.composeBettingTimeValidationCriteria = jest
        .fn()
        .mockReturnValue([]);
    });
    it('should return expected when empty ingame', async () => {
      // Arrange
      const consumer = new BaseCallConsumer(definition, gameData, publisher, logService);
      gameData.ingame = {};
      const expected = [
        {
          failure: true,
          notice: { errorCode: helpers.noticeHelper.invalidBet },
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
      const consumer = new BaseCallConsumer(definition, { ...gameData, ...data }, publisher, logService);
      const expected = [
        {
          failure: false,
          notice: { errorCode: helpers.noticeHelper.invalidBet },
        },
        {
          failure: false,
          notice: { errorCode: helpers.noticeHelper.invalidBet },
        },
      ];

      // Act
      const actual = await consumer.composeBettingTimeValidationCriteria(player);

      // Assert
      expect(actual).toStrictEqual(expected);
    });
  });
});
