import HistoryQuery from '../../../src/query-apis/history-query';
import { compareCombination } from '../../../src/helpers/result-helper';

jest.mock('../../../src/helpers/result-helper');
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
    it('should return expected when isFold false', () => {
      // Arrange
      const bet = {
        isFold: false,
        bet: 30,
        betWin: 0,
        result: { id: 2, cards: [{ rank: 1 }, { rank: 1 }] },
        settlementResult: { ante: 0, aa: 0, call: 0 },
        cards: [{ rank: 1 }],
        ante: 10,
        aa: 10,
        call: 10,
        other: 'a',
        time: new Date(123),
        callTime: new Date(123),
        roundId: 1,
      };

      const round = {
        result: { dealer: [{ rank: 2 }], communityCards: [{ rank: 1 }] },
        settlementResult: { id: 1, cards: [{ rank: 2 }, { rank: 1 }], isQualified: false },
        other: 'b',
        isSwappedOrHold: true,
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

      const bets = [
        {
          betChoice: 'ante',
          time: bet.time,
          odds: bet.anteOdds,
          stake: bet.ante,
          win: bet.settlementResult.ante,
        },
        {
          betChoice: 'aa',
          time: bet.time,
          odds: bet.aaOdds,
          stake: bet.aa,
          win: bet.settlementResult.aa,
        },
        {
          betChoice: 'call',
          time: bet.callTime,
          odds: bet.callOdds,
          stake: bet.call,
          win: bet.settlementResult.call,
        },
      ];

      const expected = {
        player,
        dealer,
        communityCards: round.result.communityCards,
        bets,
        isFold: bet.isFold,
        isPlayerWin: 0,
        roundId: 1,
        isSwappedOrHold: true,
      };
      compareCombination.mockReturnValue(0);

      // Act
      const actual = query.convertTicketDetail(bet, round);

      // Assert
      expect(actual).toStrictEqual(expected);
    });

    it('should return expected when isFold true', () => {
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
        time: new Date(123),
        callTime: new Date(123),
        roundId: 1,
      };
      const round = {
        result: { dealer: [{ rank: 2 }], communityCards: [{ rank: 1 }] },
        other: 'b',
        isSwappedOrHold: false,
      };
      const player = {
        cards: bet.cards,
        combination: bet.result.cards,
        handId: bet.result.id,
      };
      const bets = [
        {
          betChoice: 'ante',
          time: bet.time,
          odds: bet.anteOdds,
          stake: bet.ante,
          win: bet.settlementResult.ante,
        },
        {
          betChoice: 'aa',
          time: bet.time,
          odds: bet.aaOdds,
          stake: bet.aa,
          win: bet.settlementResult.aa,
        },
      ];
      const expected = {
        player,
        dealer: {},
        communityCards: round.result.communityCards,
        bets,
        isFold: bet.isFold,
        isPlayerWin: -1,
        roundId: 1,
        isSwappedOrHold: false,
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
      const bet = { roundId: 1, bet: 10 };
      const round = { id: 1, settlementResult: { id: 2, isQualified: true } };
      query.betsRepository = {
        countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue(1) }),
        find: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue([bet]) }),
        }),
      };
      query.roundQuery = { getOne: jest.fn(bet.roundId, { _id: false }).mockReturnValue(round) };
      query.convertBet = jest.fn().mockReturnValue({ stake: bet.bet });
      compareCombination.mockReturnValue(0);
      const expected = {
        history: {
          betLogs: [
            {
              stake: bet.bet,
              roundId: round.id,
              dealerHandId: round.settlementResult.id,
              isQualified: round.settlementResult.isQualified,
              isPlayerWin: 0,
            },
          ],
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

    it('should return expected when bets length greater than 0', async () => {
      const bet = { roundId: 1, bet: 10 };
      const round = { id: 1 };
      query.betsRepository = {
        countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue(1) }),
        find: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue([bet]) }),
        }),
      };
      query.roundQuery = { getOne: jest.fn(bet.roundId, { _id: false }).mockReturnValue(round) };
      query.convertBet = jest.fn().mockReturnValue({ stake: bet.bet });
      compareCombination.mockReturnValue(0);
      const expected = {
        history: {
          betLogs: [
            {
              stake: bet.bet,
              roundId: round.id,
              dealerHandId: round.settlementResult?.id,
              isQualified: round.settlementResult?.isQualified,
              isPlayerWin: -1,
            },
          ],
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
      const bet = { roundId: roundId };
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
