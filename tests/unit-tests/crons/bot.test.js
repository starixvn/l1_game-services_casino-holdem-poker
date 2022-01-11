import { BaseBot } from 'sc-game-base/src/core/crons';
import { helpers } from 'sc-common';
import Bot from '../../../src/crons/bot';

jest.mock('sc-common');

describe('Bot test', () => {
  it('inherit BaseBot', () => {
    // Act
    const bot = new Bot();

    // Assert
    expect(bot instanceof BaseBot);
  });

  describe('reset', () => {
    it('should run correctly when bot enabled is false', async () => {
      // Arrange
      const bot = new Bot();
      bot.removeAllBots = jest.fn();
      bot.resetAllBotData = jest.fn();
      bot.gameData = { gameConfigs: { botenabled: false } };

      // Act
      await bot.reset();

      // Assert
      expect(bot.removeAllBots).toHaveBeenCalled();
      expect(bot.resetAllBotData).toHaveBeenCalled();
    });
    describe('when bot enabled', () => {
      it('should update maxNumberOfBots when botRatio not equal currentBotRatio', async () => {
        // Arrange
        const bot = new Bot();
        bot.resetAllBotData = jest.fn();
        bot.gameData = { gameConfigs: { botenabled: true } };
        helpers.configHelper.getMaxBotForCurrentHour.mockReturnValue(1);
        bot.currentBotRatio = 0;
        bot.userInfosRepository = {
          countDocuments: jest.fn().mockReturnValue({
            exec: jest.fn().mockReturnValue(2),
          }),
        };
        bot.maxNumberOfBots = 0;

        // Act
        await bot.reset();

        // Assert
        expect(bot.currentBotRatio).toBe(1);
        expect(bot.maxNumberOfBots).toBe(2);
        expect(bot.resetAllBotData).toHaveBeenCalled();
      });

      it('should run correctly when botRatio not equal currentBotRatio', async () => {
        // Arrange
        const bot = new Bot();
        bot.resetAllBotData = jest.fn();
        bot.gameData = { gameConfigs: { botenabled: true } };
        helpers.configHelper.getMaxBotForCurrentHour.mockReturnValue(1);
        bot.currentBotRatio = 1;
        bot.userInfosRepository = {
          countDocuments: jest.fn(),
        };
        bot.maxNumberOfBots = 10;

        // Act
        await bot.reset();

        // Assert
        expect(bot.userInfosRepository.countDocuments).not.toHaveBeenCalled();
        expect(bot.resetAllBotData).toHaveBeenCalled();
      });
    });
  });

  describe('run', () => {
    it('should increase round id when have bot', async () => {
      // Arrange
      const bot = new Bot();
      bot.gameData = { gameConfigs: { botenabled: true }, roundId: 10 };
      bot.maxNumberOfBots = 5;
      bot.chance = {
        integer: jest.fn().mockReturnValue(2),
      };

      // Act
      await bot.run();

      // Assert
      expect(bot.gameData.roundId).toBe(12);
    });

    it('should run correctly when botenabled false', async () => {
      // Arrange
      const bot = new Bot();
      bot.gameData = { gameConfigs: { botenabled: false }, roundId: 10 };

      // Act
      await bot.run();

      // Assert
      expect(bot.gameData.roundId).toBe(10);
    });
  });
});
