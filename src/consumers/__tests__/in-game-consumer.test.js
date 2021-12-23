import { Core, Table } from 'sc-game-base';
import InGameConsumer from '../in-game-consumer';

jest.mock('sc-base-database');

describe('InGameConsumer test', () => {
  // Arrange
  const definition = new Core.GameDefinition({ id: 1, name: 'casinoholdempoker' });
  const gameData = new Table.TableGameData();
  const realPlayer = {
    UID: 1,
    session: { currency: 'IN', language: 'en' },
    profile: { name: 'a' },
    session: {
      currencyGroupId: 1,
      currencyCode: "USD",
      multiplier: 1000,
    }
  };

  gameData.md5 = "123";
  gameData.resultKey = { rawValue: "456", formatValue: { cards: [], suffix: "aaa" } };
  gameData.gameConfigs = {
    enabled: true,
    minbet: 1,
    maxbet: 1000,
    choices_maxbet: {
      choice01: 200,
    },
    odds: {
      choice01: 2,
    },
    enableFreeBet: false,
  };
  gameData.exchangeRates = {
    exId: 1,
    code: {
      USD: 1,
      VND: 0.00004405,
      IDR: 0.07099,
    },
  };

  it('inherit BaseInGameConsumer', () => {
    // Act
    const consumer = new InGameConsumer(definition, gameData);

    // Assert
    expect(consumer instanceof Core.BaseEventConsumers.InGameConsumer);
  });

  describe('buildPayload', () => {
    beforeEach(() => {
      Core.BaseEventConsumers.InGameConsumer.prototype.buildPayload = jest.fn();
    });

    it('should return expected when have betTracks', async () => {
      // Arrange
      const betTracks = {
        roundId: 10,
        bets: { ante: 10, aa: 10 },
        player: [],
        communityCards: [{ rank: 0, suit: 1 }],
        combinationResult: { player: {} },
      };
      const data = {
        ...gameData,
        ingame: {
          [realPlayer.profile.name]: { betTracks },
        },
        roundId: 10,
      };
      const consumer = new InGameConsumer(definition, data);
      consumer.getBalance = jest.fn();
      consumer.getUserInfo = jest.fn().mockReturnValue({ uid: realPlayer.UID });
      const expected = {
        gameConfigs: {
          enableFreeBet: false,
          odds: {
            choice01: 2,
          },
        },
        ownBets: {
          roundId: betTracks.roundId,
          bets: betTracks.bets,
          player: betTracks.player,
          communityCards: betTracks.communityCards,
          combinationResult: betTracks.combinationResult,
          totalAmount: 20,
        },
        user: { uid: realPlayer.UID, rate: 1000 },
        lastRoundId: data.roundId,
        md5: {
          key: "123",
        },
        totalBets: {},
      };

      // Act
      const actual = await consumer.buildPayload(realPlayer);

      // Assert
      expect(consumer.getBalance).toHaveBeenCalledWith(realPlayer, true);
      expect(actual).toStrictEqual(expected);
    });

    it('should return expected when betTracks empty', async () => {
      // Arrange
      const data = {
        ...gameData,
        ingame: {},
        roundId: 10,
      };
      const consumer = new InGameConsumer(definition, data);
      consumer.getBalance = jest.fn();
      consumer.getUserInfo = jest.fn().mockReturnValue({ uid: realPlayer.UID });
      const expected = {
        gameConfigs: {
          enableFreeBet: false,
          odds: {
            choice01: 2,
          },
        },
        ownBets: {},
        user: { uid: realPlayer.UID, rate: 1000 },
        lastRoundId: data.roundId,
        md5: {
          key: "123",
        },
        totalBets: {},
      };

      // Act
      const actual = await consumer.buildPayload(realPlayer);

      // Assert
      expect(consumer.getBalance).toHaveBeenCalledWith(realPlayer, true);
      expect(actual).toStrictEqual(expected);
    });
  });
});
