import BasePlaceBetConsumer from './base-place-bet-consumer';
import { helpers } from 'sc-common';
import gameSettings from '../game-settings';

export default class UserDealConsumer extends BasePlaceBetConsumer {
  async composeActionValidationCriteria(player, payload) {
    const configs = this.gameData.gameConfigs;
    const formatNumberWithComma = helpers.numberHelper.formatNumberWithComma;
    const amountAnte = payload.ante;
    const amountAa = payload.aa;

    return [
      {
        failure: amountAnte > configs.choices_maxbet.anteBet,
        notice:"maxBetChoice",
      },
      {
        failure: amountAa > configs.choices_maxbet.aaBet,
        notice: "maxBetChoice",
      },
      {
        failure: amountAnte < configs.minbet || (amountAa !== 0 && amountAa < configs.minbet),
        notice:"minBet",
      },
      {
        failure: amountAnte + amountAa > configs.maxbet,
        notice: "maxBet",
      },
    ];

    // return [
    //   {
    //     failure: amountAnte > configs.maxBetChoices.anteBet,
    //     notice: translation.t(translation.keys.maxBetChoice, {
    //       max: formatNumberWithComma(configs.maxBetChoices.anteBet),
    //     }),
    //   },
    //   {
    //     failure: amountAa > configs.maxBetChoices.aaBet,
    //     notice: translation.t(translation.keys.maxBetChoice, {
    //       max: formatNumberWithComma(configs.maxBetChoices.aaBet),
    //     }),
    //   },
    //   {
    //     failure: amountAnte < configs.minBet || (amountAa !== 0 && amountAa < configs.minBet),
    //     notice: translation.t(translation.keys.minBet, {
    //       min: formatNumberWithComma(configs.minBet),
    //     }),
    //   },
    //   {
    //     failure: amountAnte + amountAa > configs.maxBet,
    //     notice: translation.t(translation.keys.maxBet, {
    //       max: formatNumberWithComma(configs.maxBet),
    //     }),
    //   },
    // ];
  }

  async composeBettingTimeValidationCriteria(player) {
    const result = await super.composeBettingTimeValidationCriteria(player);
    const { betTracks } = this.gameData.ingame[player.profile.name] || { betTracks: {} };
    result.push({
      failure: !!betTracks.roundId,
      notice: "invalidDealDueToRunningRound",
    });
    result.push({
      failure: !!betTracks?.isDealing,
      notice: "placeBetIsProcessingMessage",
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
