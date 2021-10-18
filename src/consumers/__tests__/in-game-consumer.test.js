import { Core, Table } from 'sc-game-base';
import InGameConsumer from '../in-game-consumer';

jest.mock('sc-base-database');

describe('InGameConsumer test', () => {
  // Arrange
  const definition = new Core.GameDefinition({ id: 1, name: 'casinoholdempoker' });
  const gameData = new Table.TableGameData();
  it('inherit BaseInGameConsumer', () => {
    // Act
    const consumer = new InGameConsumer(definition, gameData);

    // Assert
    expect(consumer instanceof Core.BaseEventConsumers.InGameConsumer );
  });

  describe('consume', () => {
    let socketClient;
    let player;
    const user = { red: 0, type: false, avatarId: 1 };
    let expectedPlayer;
    beforeEach(() => {
      socketClient = { emit: jest.fn() };
      player = { UID: 1, profile: { name: 'a' }, socketClient };
      expectedPlayer = {
        id: player.UID,
        name: player.profile.name,
        red: user.red,
        avatarId: user.avatarId,
        type: user.type,
      };
    });
    afterEach(() => {
      socketClient = null;
      player = {};
      expectedPlayer = {};
    });
    it('run correctly when game enabled', async () => {
      // Arrange
      const data = { ...gameData, gameConfigs: { enabled: true }, players: {} };
      const consumer = new InGameConsumer(definition, data);
      consumer.buildPayload = jest.fn().mockReturnValue({ user });

      // Act
      await consumer.consume(player);

      // Assert
      expect(consumer.gameData.players[player.UID]).toStrictEqual(expectedPlayer);
      expect(socketClient.emit).toHaveBeenCalledTimes(1);
      expect(socketClient.emit).toHaveBeenCalledWith(definition.name, { user });
    });

    it('run correctly when game disabled', async () => {
      // Arrange
      const data = { ...gameData, players: { 1: {} }, remainingTime: 39, umMessages: 'um' };
      const consumer = new InGameConsumer(definition, data);
      consumer.buildPayload = jest.fn().mockReturnValue({ user });

      // Act
      await consumer.consume(player);

      // Assert
      expect(socketClient.emit).toHaveBeenCalledTimes(2);
      expect(socketClient.emit).toHaveBeenCalledWith(definition.name, {
        remainingTime: data.remainingTime,
        um: true,
        um_message: 'um',
      });
      expect(socketClient.emit).toHaveBeenCalledWith(definition.name, { user });
    });
  });

  describe('buildPayload', () => {
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
        gameConfigs: {},
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
      };

      // Act
      const actual = await consumer.buildPayload(realPlayer);

      // Assert
      expect(consumer.getBalance).toHaveBeenCalledWith(realPlayer, true);
      expect(actual).toStrictEqual(expected);
    });
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
      gameConfigs: {},
      ownBets: {},
      user: { uid: realPlayer.UID },
      lastRoundId: data.roundId,
    };

    // Act
    const actual = await consumer.buildPayload(realPlayer);

    // Assert
    expect(consumer.getBalance).toHaveBeenCalledWith(realPlayer, true);
    expect(actual).toStrictEqual(expected);
  });
});
