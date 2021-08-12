import BasePlaceBetConsumer from './base-place-bet-consumer';
import { helpers } from 'sc-common';
import { loadLanguage } from '../resources/translation/languages';
import Translation from '@nex3/translation';
import MarketManagement from '@nex3/market-management';

export default class BaseCallConsumer extends BasePlaceBetConsumer {
  async composeActionValidationCriteria(player, amount) {
    const marketManagement = MarketManagement.getInstance();
    const configs = await marketManagement.getGameMarketConfig(
      this.definition.id,
      player.session?.currency,
      player.session?.language,
    );
    const resource = await loadLanguage(player?.session?.language);
    const translation = Translation.getInstance(player?.session?.language, resource);
    const formatNumberWithComma = helpers.numberHelper.formatNumberWithComma;

    return [
      {
        failure: amount > configs.maxBetChoices.callBet,
        notice: translation.t(translation.keys.maxBetChoice, {
          max: formatNumberWithComma(configs.maxBetChoices.callBet),
        }),
      },
      {
        failure: amount > configs.maxBet,
        notice: translation.t(translation.keys.maxBet, {
          max: formatNumberWithComma(configs.maxBet),
        }),
      },
    ];
  }

  async composeBettingTimeValidationCriteria(player) {
    const result = await super.composeBettingTimeValidationCriteria(player);
    const translation = Translation.getInstance(player?.session?.language);
    const playerData = this.gameData.ingame[player.profile.name];
    if (!playerData) {
      this.logService.logWarning(`player ${player.profile.name} ingame undefined`);

      result.push({
        failure: true,
        notice: translation.t(translation.keys.cannotProcessBet),
      });
    } else {
      const { betTracks } = playerData;
      result.push({
        failure: !betTracks.roundId,
        notice: translation.t(translation.keys.cannotProcessBet),
      });
    }

    return result;
  }
}
