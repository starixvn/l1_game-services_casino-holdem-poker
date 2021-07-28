import { Core } from 'sc-game-base';

export default class SettleGameConsumer extends Core.BaseEventConsumers.SettleGameRoundConsumer {
  async settleRound(playerName, isAutoSettle = false) {
    // const betTrack = this.gameData.ingame[playerName].betTracks;
    // const result = this.definition.generateResult(betTrack.communityCards, betTrack.deck);
    // const settlementResult = this.definition.settle(result);
    // const round = await this.roundsRepository.findOne({ id: betTrack.roundId }).lean().exec();
    // const finish = {
    //   settlementResult,
    //   result,
    //   roundId: betTrack.roundId,
    //   odds: round.odds,
    //   time: new Date(),
    // };
    // await this.roundsRepository.updateOne(
    //   { id: betTrack.roundId },
    //   {
    //     result,
    //     settlementResult,
    //     time: new Date(),
    //     ended: true,
    //   },
    // );
    // await this.settleBets({ ...finish, playerName, playerUID: betTrack.uid }, isAutoSettle);
  }

  async settleBets(
    { result, settlementResult, roundId, odds, time, playerName, playerUID },
    isAutoSettle = false,
  ) {
    //   const bets = await this.betsRepository.find({ phien: roundId, thanhtoan: false }).exec();
    //   const winningHands = [];
    //   const settleOdds = odds ?? this.gameData.gameConfigs.odds;
    //   if (bets && bets.length) {
    //     await Promise.all(
    //       bets.map(async (bet) => {
    //         const betResult = this.calculateBetResult(result, bet, settleOdds);
    //         bet.betwin = betResult.totalWin;
    //         bet.thanhtoan = true;
    //         bet.result = betResult.result;
    //         bet.endTime = time;
    //         await bet.save();
    //         await this.callEndGame(bet, bet.id, time, betResult);
    //         if (betResult.netWin > 0 || betResult.totalLost === 0) {
    //           winningHands.push({ id: bet.id, betwin: bet.betwin });
    //         }
    //       }),
    //     );
    //     delete this.gameData.ingame[playerName];
    //     const roundResult = {
    //       playerId: playerUID,
    //       result: this.collectRoundResult(result, settlementResult, winningHands),
    //     };
    //     this.roundResultPublisher.publishRoundResult(roundResult, isAutoSettle);
    //   }
  }
}
