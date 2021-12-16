import BasePlaceBetConsumer from './base-place-bet-consumer';
import { helpers } from "sc-common";

export default class BaseCallConsumer extends BasePlaceBetConsumer {
  async composeActionValidationCriteria(player, amount) {
    const settings = this.gameData.currencyGroupGames.find((x) => x.groupId.toString() === player.session.currencyGroupId);
    const { betTracks } = this.gameData.ingame[player.profile.name] || { betTracks: {} };
    const { aa, ante } = betTracks.bets || { aa: 0, ante: 0 };
    const maxBet = Math.min(player.profile.maxBet, settings.maxBet);
    const formatNumberWithComma = helpers.numberHelper.formatNumberWithComma;

    return [
      {
        failure: amount >  settings.maxBetPerChoices.callBet,
        notice: this.getNoticeObj(helpers.noticeHelper.maxBetForChoice, { maxBet: formatNumberWithComma(settings.maxBetPerChoices.callBet) })
      },
      {
        failure: amount + aa + ante > maxBet,
        notice: this.getNoticeObj(helpers.noticeHelper.maxBet, { maxBet: formatNumberWithComma(maxBet) })
      },
    ];
  }

  async composeBettingTimeValidationCriteria(player) {
    const result = await super.composeBettingTimeValidationCriteria(player);
    const playerData = this.gameData.ingame[player.profile.name];
    if (!playerData) {
      this.logService.logWarning(`player ${player.profile.name} ingame undefined`);

      result.push({
        failure: true,
        notice: this.getNoticeObj(helpers.noticeHelper.invalidBet)
      });
    } else {
      const { betTracks } = playerData;
      result.push(
        {
          failure: !betTracks.roundId,
          notice:this.getNoticeObj(helpers.noticeHelper.invalidBet)
        },
        {
          failure: !!betTracks?.isDealing,
          notice: this.getNoticeObj(helpers.noticeHelper.invalidBet)
        },
      );
    }

    return result;
  }
}
