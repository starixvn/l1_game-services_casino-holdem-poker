export default class HistoryQuery {
  constructor(roundQuery, betsRepository) {
    this.roundQuery = roundQuery;
    this.betsRepository = betsRepository;
  }

  convertBet(bet) {
    return {
      time: bet.time,
      playerHandId: bet.result.id,
      isFold: bet.isFold,
      stake: bet.bet,
      betWin: bet.betwin,
    };
  }

  convertTicketDetail(bet, round) {
    const player = {
      cards: bet.cards,
      combination: bet.result.cards,
      handId: bet.result.id,
    };
    const dealer = bet.isFold
      ? {}
      : {
          cards: round.result.dealer,
          combination: round.settlementResult?.cards,
          handId: round.settlementResult?.id,
          isQualified: round.settlementResult?.isQualified,
        };
    const bets = {
      ante: bet.ante,
      aa: bet.aa,
      call: bet.call,
      bet: bet.bet,
      result: bet.settlementResult,
    };
    return {
      player,
      dealer,
      communityCards: round.result.communityCards,
      bets,
      isFold: bet.isFold,
    };
  }

  async queryHistory(player, page, pageSize) {
    if (page < 1 || !player) {
      return {};
    }

    const filter = { uid: player.UID, thanhtoan: true };
    const numberOfSkippedBets = (page - 1) * pageSize;
    const total = await this.betsRepository.countDocuments(filter).exec();
    const betProjection = {
      _id: false,
      uid: false,
      thanhtoan: false,
      siteId: false,
      memberId: false,
      __v: false,
      __archive: false,
    };
    const bets = await this.betsRepository
      .find(filter, betProjection, {
        sort: { _id: -1 },
        skip: numberOfSkippedBets,
        limit: pageSize,
      })
      .lean()
      .exec();
    let betLogs = [];

    if (bets && bets.length > 0) {
      betLogs = await Promise.all(
        bets.map(async (bet) => {
          const round = await this.roundQuery.getOne(bet.phien, { _id: false });
          return {
            ...this.convertBet(bet),
            roundId: round.id,
            dealerHandId: round.settlementResult?.id,
          };
        }),
      );
    }
    return { history: { betLogs, page, pageSize, total } };
  }

  async queryTicketDetail(player, roundId) {
    if (roundId < 1 || !player) {
      return {};
    }

    const bet = await this.betsRepository
      .findOne({ uid: player.UID, thanhtoan: true, phien: roundId })
      .lean()
      .exec();
    if (bet) {
      const round = await this.roundQuery.getOne(bet.phien, { _id: false });
      return { ticketDetail: { ...this.convertTicketDetail(bet, round) } };
    } else {
      return {};
    }
  }
}
