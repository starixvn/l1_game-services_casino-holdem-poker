import { Core } from 'sc-game-base';
import { gameNotifications } from 'sc-base-database';
import { ranks } from '../helpers/constants';
import { compareCombination, isWinAA } from '../helpers/result-helper';
import { createHashMD5, randomString } from "../helpers/crypto-helper";

export default class SettleGameConsumer extends Core.BaseEventConsumers.SettleGameRoundConsumer {
  constructor({
    definition,
    gameData,
    roundResultPublisher,
    userBetResultPublisher,
    endGame,
    roundsRepository,
    betsRepository,
    publisher,
  }) {
    super({
      definition,
      gameData,
      roundResultPublisher,
      userBetResultPublisher,
      endGame,
      roundsRepository,
      betsRepository,
    });

    this.publisher = publisher;
  }

  async settleRound(playerName, isFold = false) {
    const { betTracks } = this.gameData.ingame[playerName];
    const result = { dealer: betTracks.dealer, communityCards: betTracks.communityCards };
    const settlementResult = betTracks.combinationResult.dealer;

    if (!isFold) {
      settlementResult.isQualified = betTracks.combinationResult.isQualified;
    }

    // TODO
    const resultKey = `[${playerName};${JSON.stringify(settlementResult)}]${randomString()}`;
    const md5 = createHashMD5(resultKey);
    this.gameData.currentMD5 = md5;
    this.gameData.resultKey = resultKey;

    const round = await this.roundsRepository
      .findOneAndUpdate(
        { id: betTracks.roundId },
        { result, settlementResult, time: new Date(), ended: true, md5, resultKey },
      )
      .lean()
      .exec();
    const finish = {
      roundId: betTracks.roundId,
      odds: round.odds,
      time: new Date(),
    };

    this.roundResultPublisher.publishMD5(md5);
    await this.settleBets({ ...finish, playerName, playerUID: betTracks.uid }, isFold);
    await gameNotifications.deleteOne({ uid: betTracks.uid, gameId: this.definition.id });
  }

  async settleBets({ roundId, odds, time, playerName, playerUID }, isFold = false) {
    const bet = await this.betsRepository.findOne({ phien: roundId, thanhtoan: false }).exec();
    if (bet) {
      const settleOdds = odds ?? this.gameData.gameConfigs.odds;
      const betResult = this.calculateBetResult(playerName, bet, settleOdds, isFold);

      bet.isFold = isFold;
      bet.betwin = betResult.totalWin;
      bet.thanhtoan = true;
      bet.result = betResult.result;
      bet.settlementResult = betResult.settlementResult;
      bet.endTime = time;

      await bet.save();
      await this.callEndGame(bet, roundId, time, betResult);

      delete this.gameData.ingame[playerName];

      this.publisher.publishToUser(playerUID, {
        resultKey: this.gameData.resultKey,
        finish: {
          settlementResult: betResult.settlementResult,
        },
      });
    }
  }

  calculateBetResult(playerName, bet, settleOdds, isFold) {
    const odds = this.normalizeOdds(settleOdds);
    const { betTracks } = this.gameData.ingame[playerName];
    const combinationPlayerResult = betTracks.combinationResult.player;
    const result = {
      totalBetAmount: Object.values(betTracks.bets).reduce((total, item) => total + item),
      totalWin: 0,
      netWin: 0,
      totalLost: 0,
      result: combinationPlayerResult,
      settlementResult: { ante: 0, call: 0, aa: 0 },
    };

    if (isFold) {
      result.totalLost += bet.ante + bet.aa;
    } else {
      const combinationDealerResult = betTracks.combinationResult.dealer;

      const compare = compareCombination(combinationPlayerResult, combinationDealerResult);
      if (compare < 0) {
        this.settleHandPlayerWin(playerName, odds, bet, result);
      } else {
        if (compare === 0) {
          // tie
          this.settleHandPlayerTie(playerName, odds, bet, result);
        } else {
          this.settleHandPlayerLose(playerName, odds, bet, result);
        }
      }

      this.settleAABet(playerName, odds, bet, result);
    }

    return result;
  }

  settleHandPlayerWin(playerName, odds, bet, result) {
    const { betTracks } = this.gameData.ingame[playerName];
    const combinationPlayerResult = betTracks.combinationResult.player;
    const qualified = betTracks.combinationResult.isQualified;

    if (qualified) {
      const betAmount = bet.call ?? 0;
      const originalOdds = odds.CallBet || 1;
      const winAmount = betAmount * originalOdds;

      result.totalWin += winAmount;
      result.netWin += winAmount - betAmount;
      result.settlementResult.call = winAmount;
    } else {
      result.totalWin += bet.call;
      result.settlementResult.call = bet.call;
    }
    this.settleDetailBetResult(result, odds.AnteBet, bet, combinationPlayerResult, 'ante');
  }

  settleHandPlayerTie(playerName, odds, bet, result) {
    const { betTracks } = this.gameData.ingame[playerName];
    const combinationPlayerResult = betTracks.combinationResult.player;
    const qualified = betTracks.combinationResult.isQualified;

    if (qualified) {
      result.totalWin += bet.call + bet.ante;
      result.settlementResult.ante = bet.ante;
      result.settlementResult.call = bet.call;
    } else {
      result.totalWin += bet.call;
      result.settlementResult.call = bet.call;
      this.settleDetailBetResult(result, odds.AnteBet, bet, combinationPlayerResult, 'ante');
    }
  }

  settleHandPlayerLose(playerName, odds, bet, result) {
    const { betTracks } = this.gameData.ingame[playerName];
    const combinationPlayerResult = betTracks.combinationResult.player;
    const qualified = betTracks.combinationResult.isQualified;

    if (qualified) {
      result.totalLost = bet.call + bet.ante;
    } else {
      result.totalWin += bet.call;
      result.settlementResult.call = bet.call;
      this.settleDetailBetResult(result, odds.AnteBet, bet, combinationPlayerResult, 'ante');
    }
  }

  settleAABet(playerName, odds, bet, result) {
    const { betTracks } = this.gameData.ingame[playerName];
    const combinationAAResult = this.definition.settle(
      betTracks.player.concat(
        betTracks.communityCards[0],
        betTracks.communityCards[1],
        betTracks.communityCards[2],
      ),
    );
    if (isWinAA(combinationAAResult)) {
      this.settleDetailBetResult(result, odds.AABet, bet, combinationAAResult, 'aa');
    } else {
      result.totalLost += bet.aa;
    }
  }

  settleDetailBetResult(result, odds, bet, combinationResult, type) {
    const betAmount = bet[type] ?? 0;
    const originalOdds = odds[combinationResult.id] || 1;
    const winAmount = betAmount * originalOdds;

    result.totalWin += winAmount;
    result.netWin += winAmount - betAmount;
    result.settlementResult[type] = winAmount;
  }

  normalizeOdds(settleOdds) {
    return Object.entries(settleOdds).reduce(
      (result, [key, value]) => {
        const name = key.split('_');
        if (name[0] === 'CallBet') {
          result.CallBet = value;
        } else {
          result[name[0]][ranks[name[1]]] = value;
        }
        return result;
      },
      { CallBet: 0, AnteBet: {}, AABet: {} },
    );
  }
}
