import { Core, Table } from 'sc-game-base';
import BasePlaceBetConsumer from '../base-place-bet-consumer';
import gameSettings from '../../game-settings';

describe('BasePlaceBetConsumer test', () => {
  const definition = new Core.GameDefinition({ id: 1, name: 'casino-holdem-poker' });
  const gameData = new Table.TableGameData();
  const logService = { logError: jest.fn() };
  const publisher = { publishToUser: jest.fn() };

  describe('composeActionValidationCriteria', () => {
    it('should return empty array', async () => {
      // Arrange
      const consumer = new BasePlaceBetConsumer(definition, gameData, publisher, logService);

      // Act
      const actual = await consumer.composeActionValidationCriteria({ uid: 1 }, {});

      // Assert
      expect(actual).toBeArrayOfSize(0);
    });
  });

  describe('composeValidationCriteria', () => {
    it('should return array concat from composeBettingTimeValidationCriteria and composeActionValidationCriteria', async () => {
      // Arrange
      const consumer = new BasePlaceBetConsumer(definition, gameData, publisher, logService);
      const player = { uid: 1 };
      const expected = [
        {
          failure: false,
          notice: '1',
        },
        {
          failure: true,
          notice: '2',
        },
      ];
      consumer.composeBettingTimeValidationCriteria = jest
        .fn(player)
        .mockReturnValue([expected[0]]);
      consumer.composeActionValidationCriteria = jest.fn(player, {}).mockReturnValue([expected[1]]);

      // Act
      const actual = await consumer.composeValidationCriteria(player, {});

      // Assert
      expect(actual).toStrictEqual(expected);
    });

    it('should return empty array when composeBettingTimeValidationCriteria and composeActionValidationCriteria null', async () => {
      // Arrange
      const consumer = new BasePlaceBetConsumer(definition, gameData, publisher, logService);
      const player = { uid: 1 };
      consumer.composeBettingTimeValidationCriteria = jest.fn(player).mockReturnValue(null);
      consumer.composeActionValidationCriteria = jest.fn(player, {}).mockReturnValue(null);

      // Act
      const actual = await consumer.composeValidationCriteria(player, {});

      // Assert
      expect(actual).toBeArrayOfSize(0);
    });
  });

  describe('composeBettingTimeValidationCriteria', () => {
    it('should return expected', async () => {
      // Arrange
      const gameConfigs = { enabled: true, disabled_message: 'disabled' };
      const data = { gameConfigs };
      const consumer = new BasePlaceBetConsumer(definition, data, publisher, logService);

      const expected = [
        {
          failure: !gameConfigs.enabled,
          notice: gameConfigs.disabled_message,
        }
      ];

      // Act
      const actual = await consumer.composeBettingTimeValidationCriteria({
        session: { currency: 'US', language: 'en' },
      });

      // Assert
      expect(actual).toStrictEqual(expected);
    });
  });

  describe('validateBetRequest', () => {
    it('should return false when have failedCriterion', async () => {
      // Arrange
      const consumer = new BasePlaceBetConsumer(definition, gameData, publisher, logService);
      const player = { UID: 1 };
      const criterion = [
        {
          failure: false,
          notice: '1',
        },
        {
          failure: true,
          notice: '2',
        },
      ];
      consumer.composeValidationCriteria = jest.fn(player, {}).mockReturnValue(criterion);

      // Act
      const actual = await consumer.validateBetRequest(player, {});

      // Assert
      expect(consumer.publisher.publishToUser).toHaveBeenCalledWith(player.UID, {
        endBet: -1,
        notice: criterion[1].notice,
      });
      expect(actual).toBeFalse();
    });

    it('should return true when failedCriterion null', async () => {
      // Arrange
      const consumer = new BasePlaceBetConsumer(definition, gameData, publisher, logService);
      const player = { UID: 1 };
      const criterion = [
        {
          failure: false,
          notice: '1',
        },
        {
          failure: false,
          notice: '2',
        },
      ];
      consumer.composeValidationCriteria = jest.fn(player, {}).mockReturnValue(criterion);

      // Act
      const actual = await consumer.validateBetRequest(player, {});

      // Assert
      expect(actual).toBeTrue();
    });
  });

  describe('consume', () => {
    const keys = { cannotBetAtTheMoment: 'cannotBetAtTheMoment' };
    const player = { UID: 1, profile: { name: 'a' }, session: { language: 'en' } };

    it('should return when validBetRequest return false', async () => {
      // Arrange
      const consumer = new BasePlaceBetConsumer(definition, gameData, publisher, logService);
      consumer.gameData = { ingame: {} };
      consumer.validateBetRequest = jest.fn().mockReturnValue(false);

      // Act
      await consumer.consume(player, {}, {});

      // Assert
      expect(consumer.gameData.ingame).toStrictEqual({});
    });

    it('should log error when validBetRequest throw error', async () => {
      // Arrange
      const consumer = new BasePlaceBetConsumer(definition, gameData, publisher, logService);
      const error = new Error('test error');
      consumer.gameData = { ingame: {} };
      consumer.validateBetRequest = jest.fn(async (player, payload) => {
        throw error;
      });

      // Act
      await consumer.consume(player, {}, {});

      // Assert
      expect(consumer.logService.logError).toHaveBeenCalledWith(error);
      expect(consumer.publisher.publishToUser).toHaveBeenCalledWith(player.UID, {
        endBet: -1,
        notice: {"errorCode": "SB1935"},
      });
      expect(consumer.gameData.ingame).toStrictEqual({});
    });

    it('should publishToUser when have betQueue', async () => {
      // Arrange
      const data = { ingame: { [player.profile.name]: { betQueue: [{ action: 'deal' }] } } };
      const consumer = new BasePlaceBetConsumer(definition, data, publisher, logService);
      consumer.validateBetRequest = jest.fn().mockReturnValue(true);

      // Act
      await consumer.consume(player, {}, {});

      // Assert
      expect(consumer.publisher.publishToUser).toHaveBeenCalledWith(player.UID, {
        endBet: -1,
        notice: {"errorCode": "SB1935"},
      });
    });

    it('should add new when action deal', async () => {
      // Arrange
      const data = { ingame: {} };
      const consumer = new BasePlaceBetConsumer(definition, data, publisher, logService);
      const queuePayload = { action: gameSettings.actions.deal, payload: {} };
      consumer.validateBetRequest = jest.fn().mockReturnValue(true);

      // Act
      await consumer.consume(player, {}, queuePayload);

      // Assert
      expect(consumer.gameData.ingame[player.profile.name].name).toEqual(player.profile.name);
      expect(consumer.gameData.ingame[player.profile.name].betTracks).toStrictEqual({});
      expect(consumer.gameData.ingame[player.profile.name].betQueue[0]).toStrictEqual({
        player,
        payload: queuePayload,
      });
    });

    it('should push betQueue when action call', async () => {
      // Arrange
      const data = {
        ingame: {
          [player.profile.name]: { name: player.profile.name, betQueue: [] },
        },
      };
      const consumer = new BasePlaceBetConsumer(definition, data, publisher, logService);
      const queuePayload = { action: gameSettings.actions.call, payload: {} };
      consumer.validateBetRequest = jest.fn().mockReturnValue(true);

      // Act
      await consumer.consume(player, {}, queuePayload);

      // Assert
      expect(consumer.gameData.ingame[player.profile.name].betQueue[0]).toStrictEqual({
        player,
        payload: queuePayload,
      });
    });
  });
});
