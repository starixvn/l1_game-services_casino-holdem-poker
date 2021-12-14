import { Core } from "sc-game-base";

export default class InGameConsumer extends Core.BaseEventConsumers.InGameConsumer {
  async buildPayload(realPlayer) {
    const basePayload = await super.buildPayload(realPlayer);

    const { betTracks } = this.gameData.ingame[realPlayer.profile.name] || { betTracks: {} };
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
    await this.getBalance(realPlayer, true);

    const user = await this.getUserInfo(realPlayer.UID);
    return {
      ...basePayload,
      user,
      ownBets,
      lastRoundId: this.gameData.roundId,
      md5: this.gameData.md5
    };
  }
}
