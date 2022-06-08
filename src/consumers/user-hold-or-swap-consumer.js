import BaseCallConsumer from './base-call-consumer';
import { helpers } from 'sc-common';

export default class UserHoldOrSwapConsumer extends BaseCallConsumer {
  async composeActionValidationCriteria(player) {
    const { betTracks } = this.gameData.ingame[player.profile.name] || {
      betTracks: { isSwappedOrHold: true },
    };

    return [
      {
        failure: betTracks.isSwappedOrHold,
        notice: helpers.noticeHelper.invalidBet,
      },
    ];
  }

  async consume(player, payload) {
    await super.consume(player, payload, { action: payload.action });
  }
}
