import { Core } from 'sc-game-base';
import { helpers } from 'sc-common';

export default class Bot extends Core.Crons.BaseBot {
  async reset() {
    const configs = this.gameData.gameConfigs;

    if (configs.botenabled) {
      const botRatio = helpers.configHelper.getMaxBotForCurrentHour(configs);
      if (this.currentBotRatio !== botRatio) {
        this.currentBotRatio = botRatio;

        const totalBots = await this.userInfosRepository.countDocuments({ type: true }).exec();
        this.maxNumberOfBots = Math.floor(totalBots * this.currentBotRatio);
      }
    } else {
      await this.removeAllBots();
    }

    this.resetAllBotData();
  }

  async run() {
    if (this.gameData.gameConfigs?.botenabled && this.maxNumberOfBots > 0) {
      this.gameData.roundId += this.chance.integer({ min: 1, max: this.maxNumberOfBots });
    }
  }
}
