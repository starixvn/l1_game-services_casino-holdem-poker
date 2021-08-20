import HistoryQuery from '../history-query';

describe('History query test', () => {
  const query = new HistoryQuery();
  describe('convertBet', () => {
    it('should return expected', () => {
      // Arrange
      const bet = {
        time: new Date(123),
        isFold: true,
        bet: 100,
        betwin: 0,
        result: { id: 1, cards: [] },
        other: 'a',
      };
      const expected = {
        time: bet.time,
        playerHandId: bet.result.id,
        isFold: bet.isFold,
        stake: bet.bet,
        betWin: bet.betwin,
      };

      // Act
      const actual = query.convertBet(bet);

      // Assert
      expect(actual).toStrictEqual(expected);
    });
  });

  describe('convertTicketDetail', () => {
    it('should return expected', () => {
      // Arrange
      const bet = {
        isFold: true,
        bet: 100,
        betWin: 0,
        result: { id: 2, cards: [{ rank: 1 }, { rank: 1 }] },
        settlementResult: { ante: 0, aa: 0, call: 0 },
        cards: [{ rank: 1 }],
        ante: 10,
        aa: 10,
        call: 0,
        other: 'a',
      };
      const round = {
        result: { dealer: [{ rank: 2 }], communityCards: [{ rank: 1 }] },
        settlementResult: { id: 1, cards: [{ rank: 2 }, { rank: 1 }], isQualified: false },
        other: 'b',
      };
      const player = {
        cards: bet.cards,
        combination: bet.result.cards,
        handId: bet.result.id,
      };
      const dealer = {
        cards: round.result.dealer,
        combination: round.settlementResult.cards,
        handId: round.settlementResult.id,
        isQualified: round.settlementResult?.isQualified,
      };
      const bets = {
        ante: bet.ante,
        aa: bet.aa,
        call: bet.call,
        bet: bet.bet,
        result: bet.settlementResult,
      };
      const expected = {
        player,
        dealer,
        communityCards: round.result.communityCards,
        bets,
        isFold: bet.isFold,
      };

      // Act
      const actual = query.convertTicketDetail(bet, round);

      // Assert
      expect(actual).toStrictEqual(expected);
    });
  });

  describe('queryHistory', () => {
    const player = { UID: 1 };
    const page = 1;
    const pageSize = 8;
    it('should return empty object when player undefined', async () => {
      // Act
      const actual = await query.queryHistory(undefined, 1, 8);

      // Assert
      expect(actual).toStrictEqual({});
    });

    it('should return expected when bets length equal 0', async () => {
      // Arrange
      query.betsRepository = {
        countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue(0) }),
        find: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue([]) }),
        }),
      };
      const expected = { history: { betLogs: [], page, pageSize, total: 0 } };

      // Act
      const actual = await query.queryHistory(player, page, pageSize);

      // Assert
      expect(actual).toStrictEqual(expected);
    });

    it('should return expected when bets length greater than 0', async () => {
      const bet = { phien: 1, bet: 10 };
      const round = { id: 1, settlementResult: { id: 2 } };
      query.betsRepository = {
        countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue(1) }),
        find: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue([bet]) }),
        }),
      };
      query.roundQuery = { getOne: jest.fn(bet.phien, { _id: false }).mockReturnValue(round) };
      query.convertBet = jest.fn().mockReturnValue({ stake: bet.bet });
      const expected = {
        history: {
          betLogs: [{ stake: bet.bet, roundId: round.id, dealerHandId: round.settlementResult.id }],
          page,
          pageSize,
          total: 1,
        },
      };

      // Act
      const actual = await query.queryHistory(player, page, pageSize);

      // Assert
      expect(actual).toStrictEqual(expected);
    });
  });

  describe('queryTicketDetail', () => {
    const player = { UID: 1 };
    const roundId = 1;
    it('should return empty object when player undefined', async () => {
      // Act
      const actual = await query.queryTicketDetail(undefined, roundId);

      // Assert
      expect(actual).toStrictEqual({});
    });

    it('should return empty object when can not find bet', async () => {
      // Arrange
      query.betsRepository = {
        findOne: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue(null) }),
        }),
      };

      // Act
      const actual = await query.queryTicketDetail(player, roundId);

      // Assert
      expect(actual).toStrictEqual({});
    });

    it('should return expected when bet has value', async () => {
      // Arrange
      const bet = { phien: roundId };
      query.betsRepository = {
        findOne: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue(bet) }),
        }),
      };
      query.roundQuery = { getOne: jest.fn().mockReturnValue({ id: roundId }) };
      query.convertTicketDetail = jest.fn(bet, { id: roundId }).mockReturnValue({});
      const expected = { ticketDetail: {} };

      // Act
      const actual = await query.queryTicketDetail(player, roundId);

      // Assert
      expect(actual).toStrictEqual(expected);
    });
  });
});
