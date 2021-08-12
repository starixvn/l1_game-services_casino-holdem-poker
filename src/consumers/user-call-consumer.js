import BaseCallConsumer from './base-call-consumer';
import gameSettings from '../game-settings';

export default class UserCallConsumer extends BaseCallConsumer {
  async composeActionValidationCriteria(player, payload) {
    const { betTracks } = this.gameData.ingame[player.profile.name] || { betTracks: {} };
    const amount = betTracks.bets?.ante || 0;
    return super.composeActionValidationCriteria(player, amount);
  }

  async consume(player, payload) {
    await super.consume(player, payload, { action: gameSettings.actions.call });
  }
}
