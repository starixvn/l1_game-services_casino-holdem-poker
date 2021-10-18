import BasePlaceBetConsumer from './base-place-bet-consumer';
import { helpers } from "sc-common";

export default class BaseCallConsumer extends BasePlaceBetConsumer {
  async composeActionValidationCriteria(player, amount) {
    const configs = this.gameData.gameConfigs;
    const { betTracks } = this.gameData.ingame[player.profile.name] || { betTracks: {} };
    const { aa, ante } = betTracks.bets || { aa: 0, ante: 0 };

    return [
      {
        failure: amount > configs.choices_maxbet.callBet,
        notice: this.getNoticeObj(helpers.noticeHelper.maxBetForChoice, { maxBet: configs.choices_maxbet.callBet })
      },
      {
        failure: amount + aa + ante > configs.maxBet,
        notice: this.getNoticeObj(helpers.noticeHelper.maxBet, { maxBet: configs.maxbet })
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
      result.push({
        failure: !betTracks.roundId,
        notice: this.getNoticeObj(helpers.noticeHelper.invalidBet)
      });
    }

    return result;
  }
}
