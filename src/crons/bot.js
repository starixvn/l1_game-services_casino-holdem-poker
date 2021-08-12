import { Core } from 'sc-game-base';

export default class Bot extends Core.Crons.BaseBot {
  constructor(definition, gameData) {
    super(definition, gameData);
  }

  async run() {
    if (this.gameData.gameConfigs?.botenabled && this.maxNumberOfBots > 0) {
      this.gameData.roundId += this.chance.integer({ min: 1, max: this.maxNumberOfBots });
    }
  }
}
