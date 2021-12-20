import { Core, Table } from 'sc-game-base';
import InGameConsumer from '../in-game-consumer';

jest.mock('sc-base-database');

describe('InGameConsumer test', () => {
  // Arrange
  const definition = new Core.GameDefinition({ id: 1, name: 'casinoholdempoker' });
  const gameData = new Table.TableGameData();
  const md5 = "aabbcc";
  gameData.md5 = md5;

  it('inherit BaseInGameConsumer', () => {
    // Act
    const consumer = new InGameConsumer(definition, gameData);

    // Assert
    expect(consumer instanceof Core.BaseEventConsumers.InGameConsumer );
  });

  describe('buildPayload', () => {
    beforeEach(() => {
      Core.BaseEventConsumers.InGameConsumer.prototype.buildPayload = jest.fn(); 
    });

    it('should return expected when have betTracks', async () => {
      // Arrange
      const realPlayer = {
        UID: 1,
        session: { currency: 'IN', language: 'en' },
        profile: { name: 'a' },
      };

      const betTracks = {
        roundId: 1,
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
        roundId: 0,
      };
      const consumer = new InGameConsumer(definition, data);
      consumer.getBalance = jest.fn();
      consumer.getUserInfo = jest.fn().mockReturnValue({ uid: realPlayer.UID });
      const expected = {
        ownBets: {
          roundId: betTracks.roundId,
          bets: betTracks.bets,
          player: betTracks.player,
          communityCards: betTracks.communityCards,
          combinationResult: betTracks.combinationResult,
          totalAmount: 20,
        },
        user: { uid: realPlayer.UID },
        lastRoundId: data.roundId,
        md5
      };

      // Act
      const actual = await consumer.buildPayload(realPlayer);

      // Assert
      expect(consumer.getBalance).toHaveBeenCalledWith(realPlayer, true);
      expect(actual).toStrictEqual(expected);
    });

    it('should return expected when betTracks empty', async () => {
      // Arrange
      const realPlayer = {
        UID: 1,
        session: { currency: 'US', language: 'en' },
        profile: { name: 'a' },
      };
  
      const data = {
        ...gameData,
        ingame: {},
        roundId: 10,
      };
      const consumer = new InGameConsumer(definition, data);
      consumer.getBalance = jest.fn();
      consumer.getUserInfo = jest.fn().mockReturnValue({ uid: realPlayer.UID });
      const expected = {
        ownBets: {},
        user: { uid: realPlayer.UID },
        lastRoundId: data.roundId,
        md5
      };
  
      // Act
      const actual = await consumer.buildPayload(realPlayer);
  
      // Assert
      expect(consumer.getBalance).toHaveBeenCalledWith(realPlayer, true);
      expect(actual).toStrictEqual(expected);
    });
  });

 
});
