import BasePlaceBetConsumer from './base-place-bet-consumer';
import { helpers } from 'sc-common';
import gameSettings from '../game-settings';

export default class UserDealConsumer extends BasePlaceBetConsumer {
  async composeActionValidationCriteria(player, payload) {
    const configs = this.gameData.gameConfigs;
    const amountAnte = payload.ante;
    const amountAa = payload.aa;

    return [
      {
        failure: amountAnte > configs.choices_maxbet.anteBet,
        notice: this.getNoticeObj(helpers.noticeHelper.maxBetForChoice, { maxBet: configs.choices_maxbet.anteBet })
      },
      {
        failure: amountAa > configs.choices_maxbet.aaBet,
        notice: this.getNoticeObj(helpers.noticeHelper.maxBetForChoice, { maxBet: configs.choices_maxbet.aaBet })
      },
      {
        failure: amountAnte < configs.minbet || (amountAa !== 0 && amountAa < configs.minbet),
        notice: this.getNoticeObj(helpers.noticeHelper.minBet, { minBet: configs.minbet})
      },
      {
        failure: amountAnte + amountAa > configs.maxbet,
        notice: this.getNoticeObj(helpers.noticeHelper.maxBet, { maxBet: configs.maxbet })
      },
    ];
  }

  async composeBettingTimeValidationCriteria(player) {
    const result = await super.composeBettingTimeValidationCriteria(player);
    const { betTracks } = this.gameData.ingame[player.profile.name] || { betTracks: {} };
    result.push({
      failure: !!betTracks.roundId,
      notice: this.getNoticeObj(helpers.noticeHelper.invalidBet)
    });
    result.push({
      failure: !!betTracks?.isDealing,
      notice: this.getNoticeObj(helpers.noticeHelper.invalidBet)
    });

    return result;
  }

  async consume(player, payload) {
    Object.assign(payload, {
      aa: payload.aa >> 0,
      ante: payload.ante >> 0,
    });
    const { ante, aa } = payload;

    await super.consume(player, payload, {
      action: gameSettings.actions.deal,
      payload: { ante, aa },
    });
  }
}
