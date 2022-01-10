import { Core } from "sc-game-base";

export default class InGameConsumer extends Core.BaseEventConsumers.InGameConsumer {
  constructor(definition, gameData, roundsRepository, roundQuery, publisher, getBalance, userInfosRepository, ) {
    super(definition, gameData, roundQuery, publisher, getBalance, userInfosRepository);
    this.roundsRepository = roundsRepository;
}

  async buildPayload(realPlayer) {
    const { odds, enableFreeBet } = this.gameData.gameConfigs;
    const { totalBets, exchangeRates, roundId } = this.gameData;
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

    let ownBets = {}, md5 = {};
    if (betTracks.roundId > 0) {
      ownBets = {
        roundId: betTracks.roundId,
        bets: betTracks.bets,
        player: betTracks.player,
        communityCards: betTracks.communityCards,
        combinationResult: betTracks.combinationResult,
        totalAmount,
      };

      const round = await this.roundsRepository.findOne({ id: betTracks.roundId }).exec();
      md5 = { key: round.md5 };
    }

    return {
      gameConfigs,
      ownBets,
      totalBets,
      user: { ...user, rate },
      lastRoundId: roundId,
      md5
    };
  }
}
