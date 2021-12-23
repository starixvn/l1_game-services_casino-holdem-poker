import { Core } from "sc-game-base";

export default class InGameConsumer extends Core.BaseEventConsumers.InGameConsumer {
  async buildPayload(realPlayer) {
    const { odds, enableFreeBet } = this.gameData.gameConfigs;
    const { totalBets, exchangeRates, md5, roundId } = this.gameData;
    const { session } = realPlayer;
    const rate = exchangeRates.code[session.currencyCode] * session.multiplier;
    const settings = this.gameData.currencyGroupGames.find((x) => x.groupId.toString() === session.currencyGroupId);
    const gameConfigs = { ...settings, odds, enableFreeBet };
    const { betTracks } = this.gameData.ingame[realPlayer.profile.name] || { betTracks: {} };

    await this.getBalance(realPlayer, true);
    const user = await this.getUserInfo(realPlayer.UID);

    const totalAmount =
      betTracks.roundId > 0
        ? Object.values(betTracks.bets).reduce((total, item) => total + item, 0)
        : 0;

    const ownBets =
      betTracks.roundId > 0
        ? {
          roundId: betTracks.roundId,
          bets: betTracks.bets,
          player: betTracks.player,
          communityCards: betTracks.communityCards,
          combinationResult: betTracks.combinationResult,
          totalAmount,
        }
        : {};

    return {
      gameConfigs,
      ownBets,
      totalBets,
      user: { ...user, rate },
      lastRoundId: roundId,
      md5: { key: md5 }
    };
  }
}
