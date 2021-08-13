import { InGameConsumer as BaseInGameConsumer } from '@nex3/nex3-game-base/consumers';
import MarketManagement from '@nex3/market-management';

export default class InGameConsumer extends BaseInGameConsumer {
  async consume(realPlayer) {
    const { remainingTime, gameConfigs, umMessages } = this.gameData;
    const disabled = !gameConfigs || !gameConfigs.enabled;
    if (disabled) {
      realPlayer.socketClient.emit(this.definition.name, {
        remainingTime,
        um: disabled,
        um_message: umMessages,
      });
    }

    const payload = await this.buildPayload(realPlayer);
    const player = {
      id: realPlayer.UID,
      name: realPlayer.profile.name,
      red: payload.user.red,
      avatarId: payload.user.avatarId,
      type: payload.user.type,
    };

    if (!this.gameData.players[realPlayer.UID]) {
      this.gameData.players[realPlayer.UID] = player;
    }

    realPlayer.socketClient.emit(this.definition.name, payload);
  }

  async buildPayload(realPlayer) {
    const marketManagement = MarketManagement.getInstance();
    const marketConfig = await marketManagement.getGameMarketConfig(
      this.definition.id,
      realPlayer?.session?.currency,
      realPlayer?.session?.language,
    );

    const gameConfigs = {
      minBet: marketConfig.minBet,
      maxBet: marketConfig.maxBet,
      maxBetChoices: marketConfig.maxBetChoices,
      odds: marketConfig.odds,
    };

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
      gameConfigs,
      user,
      ownBets,
      lastRoundId: this.gameData.roundId,
    };
  }
}
