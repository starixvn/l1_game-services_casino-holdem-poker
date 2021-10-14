import BasePlaceBetConsumer from './base-place-bet-consumer';

export default class BaseCallConsumer extends BasePlaceBetConsumer {
  async composeActionValidationCriteria(player, amount) {
    const configs = this.gameData.gameConfigs;
    const { betTracks } = this.gameData.ingame[player.profile.name] || { betTracks: {} };
    const { aa, ante } = betTracks.bets || { aa: 0, ante: 0 };

    return [
      {
        failure: amount > configs.maxBetChoices.callBet,
        notice: "maxBetChoice",
      },
      {
        failure: amount + aa + ante > configs.maxBet,
        notice: "maxBet",
      },
    ];

    // return [
    //   {
    //     failure: amount > configs.maxBetChoices.callBet,
    //     notice: translation.t(translation.keys.maxBetChoice, {
    //       max: formatNumberWithComma(configs.maxBetChoices.callBet),
    //     }),
    //   },
    //   {
    //     failure: amount + aa + ante > configs.maxBet,
    //     notice: translation.t(translation.keys.maxBet, {
    //       max: formatNumberWithComma(configs.maxBet),
    //     }),
    //   },
    // ];
  }

  async composeBettingTimeValidationCriteria(player) {
    const result = await super.composeBettingTimeValidationCriteria(player);
    const playerData = this.gameData.ingame[player.profile.name];
    if (!playerData) {
      this.logService.logWarning(`player ${player.profile.name} ingame undefined`);

      result.push({
        failure: true,
        notice: "cannotProcessBet",
      });
    } else {
      const { betTracks } = playerData;
      result.push({
        failure: !betTracks.roundId,
        notice: "cannotProcessBet",
      });
    }

    return result;
  }
}
