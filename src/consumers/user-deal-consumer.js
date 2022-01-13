import BasePlaceBetConsumer from './base-place-bet-consumer';
import noticeHelper from "../helpers/notice-helper";
import gameSettings from '../game-settings';

export default class UserDealConsumer extends BasePlaceBetConsumer {
  async composeActionValidationCriteria(player, payload) {
    const settings = this.gameData.currencyGroupGames.find((x) => x.groupId.toString() === player.session.currencyGroupId);
    const amountAnte = payload.ante;
    const amountAa = payload.aa;
    const minBet = Math.max(player.profile.minBet, settings.minBet);
    const maxBet = Math.min(player.profile.maxBet, settings.maxBet);

    return [
      {
        failure: amountAnte > settings.maxBetPerChoices.anteBet,
        notice: this.getNoticeObj(noticeHelper.maxBetForChoice, { maxBet: settings.maxBetPerChoices.anteBet })
      },
      {
        failure: amountAa > settings.maxBetPerChoices.aaBet,
        notice: this.getNoticeObj(noticeHelper.maxBetForChoice, { maxBet: settings.maxBetPerChoices.aaBet })
      },
      {
        failure: amountAnte < minBet || (amountAa !== 0 && amountAa < minBet),
        notice: this.getNoticeObj(noticeHelper.minBet, { minBet: minBet})
      },
      {
        failure: amountAnte + amountAa > maxBet,
        notice: this.getNoticeObj(noticeHelper.maxBet, { maxBet: maxBet })
      },
    ];
  }

  async composeBettingTimeValidationCriteria(player) {
    const result = await super.composeBettingTimeValidationCriteria(player);
    const { betTracks } = this.gameData.ingame[player.profile.name] || { betTracks: {} };

    result.push({
      failure: !!betTracks.roundId,
      notice: this.getNoticeObj(noticeHelper.invalidDealDueToRunningRound)
    });
    result.push({
      failure: !!betTracks?.isDealing,
      notice: this.getNoticeObj(noticeHelper.invalidDealDueToRunningRound)
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
