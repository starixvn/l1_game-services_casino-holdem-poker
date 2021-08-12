import BaseCallConsumer from './base-call-consumer';
import gameSettings from '../game-settings';

export default class UserFoldConsumer extends BaseCallConsumer {
  async composeActionValidationCriteria(player, payload) {
    return [];
  }

  async consume(player, payload) {
    await super.consume(player, payload, { action: gameSettings.actions.fold });
  }
}
