import BasePlaceBetConsumer from './base-place-bet-consumer';
import MarketManagement from '@nex3/market-management';
import { helpers } from 'sc-common';
import Translation from '@nex3/translation';
import gameSettings from '../game-settings';
import { loadLanguage } from '../resources/translation/languages';

export default class UserDealConsumer extends BasePlaceBetConsumer {
  async composeActionValidationCriteria(player, payload) {
    const marketManagement = MarketManagement.getInstance();
    const configs = await marketManagement.getGameMarketConfig(
      this.definition.id,
      player.session?.currency,
      player.session?.language,
    );
    const resource = await loadLanguage(player?.session?.language);
    const translation = Translation.getInstance(player?.session?.language, resource);
    const formatNumberWithComma = helpers.numberHelper.formatNumberWithComma;
    const amountAnte = payload.ante;
    const amountAa = payload.aa;

    return [
      {
        failure: amountAnte > configs.maxBetChoices.anteBet,
        notice: translation.t(translation.keys.maxBetChoice, {
          max: formatNumberWithComma(configs.maxBetChoices.anteBet),
        }),
      },
      {
        failure: amountAa > configs.maxBetChoices.aaBet,
        notice: translation.t(translation.keys.maxBetChoice, {
          max: formatNumberWithComma(configs.maxBetChoices.aaBet),
        }),
      },
      {
        failure: amountAnte < configs.minBet || (amountAa !== 0 && amountAa < configs.minBet),
        notice: translation.t(translation.keys.minBet, {
          min: formatNumberWithComma(configs.minBet),
        }),
      },
      {
        failure: amountAnte > configs.maxBet || amountAa > configs.maxBet,
        notice: translation.t(translation.keys.maxBet, {
          max: formatNumberWithComma(configs.maxBet),
        }),
      },
    ];
  }

  async composeBettingTimeValidationCriteria(player) {
    const result = await super.composeBettingTimeValidationCriteria(player);
    const resource = await loadLanguage(player?.session?.language);
    const translation = Translation.getInstance(player?.session?.language, resource);
    const { betTracks } = this.gameData.ingame[player.profile.name] || { betTracks: {} };
    result.push({
      failure: !!betTracks.roundId,
      notice: translation.t(translation.keys.invalidDealDueToRunningRound),
    });
    result.push({
      failure: !!betTracks?.isDealing,
      notice: translation.t(translation.keys.placeBetIsProcessingMessage),
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
