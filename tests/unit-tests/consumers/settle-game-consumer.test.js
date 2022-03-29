import SettleGameConsumer from '../../../src/consumers/settle-game-consumer';
import { SettleGameRoundConsumer } from 'sc-game-base/src/core/event-consumers';
import { gameNotifications } from 'sc-base-database';
import { compareCombination, isWinAA } from '../../../src/helpers/result-helper';

jest.mock('sc-base-database');
jest.mock('../../../src/helpers/result-helper');

describe('Settle game test', () => {
  const mockDate = new Date(123456);
  let spy;
  const resultKey = { rawValue: "456", formatValue: { cards: [], suffix: "aaa" } };
  const md5 = "123";

  beforeAll(() => {
    jest.useFakeTimers();
    spy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
  });

  afterAll(() => {
    jest.clearAllMocks();
    spy.mockRestore();
  });

  it('inherit SettleGameRoundConsumer', () => {
    // Act
    const consumer = new SettleGameConsumer({});

    // Assert
    expect(consumer instanceof SettleGameRoundConsumer);
  });

  describe('settleRound', () => {
    const playerName = 'a';
    const betTracks = {
      dealer: [],
      communityCards: [],
      combinationResult: { dealer: { id: 1 }, isQualified: false },
      roundId: 1,
      uid: 1,
    };
    const gameData = { ingame: { [playerName]: { betTracks } } };
    const round = { odds: {} };
    const roundsRepository = {
      findOneAndUpdate: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue(round) }),
      }),
    };
    const definition = { id: 39 };
    it('should run correctly when fold false', async () => {
      // Arrange
      const consumer = new SettleGameConsumer({ definition, gameData, roundsRepository });
      consumer.settleBets = jest.fn();
      const result = { dealer: betTracks.dealer, communityCards: betTracks.communityCards };
      const settlementResult = {
        ...betTracks.combinationResult.dealer,
        isQualified: betTracks.combinationResult.isQualified,
      };
      const finish = { roundId: betTracks.roundId, odds: round.odds, time: new Date(123456) };

      // Act
      await consumer.settleRound(playerName);

      // Assert
      expect(roundsRepository.findOneAndUpdate).toHaveBeenCalledWith(
        { id: betTracks.roundId },
        { result, settlementResult, time: new Date(123456), ended: true },
      );
      expect(consumer.settleBets).toHaveBeenCalledWith(
        { ...finish, playerName, playerUID: betTracks.uid },
        false,
      );
      expect(gameNotifications.deleteOne).toHaveBeenCalledWith({
        uid: betTracks.uid,
        gameId: definition.id,
      });
    });

    it('should run correctly when fold true', async () => {
      // Arrange
      const consumer = new SettleGameConsumer({ definition, gameData, roundsRepository });
      consumer.settleBets = jest.fn();
      const result = { dealer: betTracks.dealer, communityCards: betTracks.communityCards };
      const settlementResult = {
        ...betTracks.combinationResult.dealer,
      };
      const finish = { roundId: betTracks.roundId, odds: round.odds, time: new Date(123456) };

      // Act
      await consumer.settleRound(playerName, true);

      // Assert
      expect(roundsRepository.findOneAndUpdate).toHaveBeenCalledWith(
        { id: betTracks.roundId },
        { result, settlementResult, time: new Date(123456), ended: true },
      );
      expect(consumer.settleBets).toHaveBeenCalledWith(
        { ...finish, playerName, playerUID: betTracks.uid },
        true,
      );
      expect(gameNotifications.deleteOne).toHaveBeenCalledWith({
        uid: betTracks.uid,
        gameId: definition.id,
      });
    });
  });

  describe('settleBets', () => {
    it('should run correctly when bet undefined', async () => {
      // Arrange
      const betsRepository = {
        findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue(undefined) }),
      };
      const consumer = new SettleGameConsumer({ betsRepository });
      consumer.calculateBetResult = jest.fn();

      // Act
      await consumer.settleBets({ roundId: 1 });

      // Assert
      expect(betsRepository.findOne).toHaveBeenCalledWith({ phien: 1, thanhtoan: false });
      expect(consumer.calculateBetResult).not.toHaveBeenCalled();
    });

    it('should run correctly when bet has value and has odds', async () => {
      // Arrange
      const betTracks = { bets: { ante: 10, aa: 10 }, combinationResult: { player: { id: 1 } }, md5, resultKey };
      const gameData = { ingame: { a: { betTracks } }, gameConfigs: {}, resultKey, md5 };
      const bet = { save: jest.fn() };
      const betsRepository = {
        findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue(bet) }),
      };
      const publisher = { publishToUser: jest.fn() };
      const consumer = new SettleGameConsumer({ gameData, betsRepository, publisher });
      const betResult = { totalWin: 10, result: { id: 1 }, settlementResult: { ante: 10 } };
      consumer.calculateBetResult = jest.fn().mockReturnValue(betResult);
      consumer.callEndGame = jest.fn();
      const finish = {
        roundId: 1,
        odds: {},
        time: new Date(123456),
        playerName: 'a',
        playerUID: 123
      };

      // Act
      await consumer.settleBets(finish);

      // Assert
      expect(bet.isFold).toBeFalse();
      expect(bet.betwin).toBe(betResult.totalWin);
      expect(bet.thanhtoan).toBeTrue();
      expect(bet.result).toStrictEqual(betResult.result);
      expect(bet.settlementResult).toStrictEqual(betResult.settlementResult);
      expect(bet.endTime).toEqual(finish.time);
      expect(bet.save).toHaveBeenCalled();
      expect(consumer.callEndGame).toHaveBeenCalledWith(
        bet,
        finish.roundId,
        finish.time,
        betResult,
      );
      expect(consumer.gameData.ingame).toStrictEqual({});
      expect(publisher.publishToUser).toHaveBeenCalledWith(finish.playerUID, {
        finish: { settlementResult: betResult.settlementResult },
        md5: { key: { rawValue: "456", formatValue: { cards: [], suffix: "aaa" } } }
      });
    });

    it('should run correctly when bet has value and not odd', async () => {
      // Arrange
      const betTracks = { bets: { ante: 10, aa: 10 }, combinationResult: { player: { id: 1 } }, md5, resultKey };
      const gameData = { ingame: { a: { betTracks } }, gameConfigs: { odds: {} } };
      const bet = { save: jest.fn() };
      const betsRepository = {
        findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue(bet) }),
      };

      const roundRepo = { md5: "123", };
      process.roundsRepository = {
        findOne: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue(roundRepo) }),
        }),
      };

      const roundRepository = {
        findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue(bet) }),
      };

      const publisher = { publishToUser: jest.fn() };
      const consumer = new SettleGameConsumer({ gameData, betsRepository, publisher });
      const betResult = { totalWin: 10, result: { id: 1 }, settlementResult: { ante: 10 } };
      consumer.calculateBetResult = jest.fn().mockReturnValue(betResult);
      consumer.callEndGame = jest.fn();
      const finish = {
        roundId: 1,
        time: new Date(123456),
        playerName: 'a',
        playerUID: 123
      };

      // Act
      await consumer.settleBets(finish);

      // Assert
      expect(bet.isFold).toBeFalse();
      expect(bet.betwin).toBe(betResult.totalWin);
      expect(bet.thanhtoan).toBeTrue();
      expect(bet.result).toStrictEqual(betResult.result);
      expect(bet.settlementResult).toStrictEqual(betResult.settlementResult);
      expect(bet.endTime).toEqual(finish.time);
      expect(bet.save).toHaveBeenCalled();
      expect(consumer.callEndGame).toHaveBeenCalledWith(
        bet,
        finish.roundId,
        finish.time,
        betResult,
      );
      expect(consumer.gameData.ingame).toStrictEqual({});
      expect(publisher.publishToUser).toHaveBeenCalledWith(finish.playerUID, {
        finish: { settlementResult: betResult.settlementResult },
        md5: { key: { rawValue: "456", formatValue: { cards: [], suffix: "aaa" } } }
      });
    });
  });

  describe('calculateBetResult', () => {
    it('should return expected when fold', () => {
      // Arrange
      const betTracks = { bets: { ante: 10, aa: 10 }, combinationResult: { player: { id: 1 } } };
      const gameData = { ingame: { a: { betTracks } } };
      const consumer = new SettleGameConsumer({ gameData });
      consumer.normalizeOdds = jest.fn().mockReturnValue({});
      const bet = { ante: 10, aa: 10 };
      const expected = {
        totalBetAmount: betTracks.bets.ante + betTracks.bets.aa,
        totalWin: 0,
        netWin: 0,
        totalLost: betTracks.bets.ante + betTracks.bets.aa,
        result: betTracks.combinationResult.player,
        settlementResult: { ante: 0, call: 0, aa: 0 },
      };

      // Act
      const actual = consumer.calculateBetResult('a', bet, {}, true);

      // Assert
      expect(actual).toStrictEqual(expected);
    });

    it('should return expected when player win', () => {
      // Arrange
      const betTracks = {
        bets: { ante: 10, aa: 10 },
        combinationResult: { player: { id: 2 }, dealer: { id: 1 } },
      };
      const gameData = { ingame: { a: { betTracks } } };
      const consumer = new SettleGameConsumer({ gameData });
      consumer.normalizeOdds = jest.fn().mockReturnValue({});
      const bet = { ante: 10, aa: 10 };
      compareCombination.mockReturnValue(-1);
      const expected = {
        totalBetAmount: betTracks.bets.ante + betTracks.bets.aa,
        totalWin: 20,
        netWin: 10,
        totalLost: 0,
        result: betTracks.combinationResult.player,
        settlementResult: { ante: 0, call: 0, aa: 0 },
      };
      consumer.settleHandPlayerWin = jest.fn((name, odds, bet, result) => {
        result.totalWin = 20;
        result.netWin = 10;
      });
      consumer.settleAABet = jest.fn();

      // Act
      const actual = consumer.calculateBetResult('a', bet, {}, false);

      // Assert
      expect(consumer.settleAABet).toHaveBeenCalledWith('a', {}, bet, expect.any(Object));
      expect(actual).toStrictEqual(expected);
    });

    it('should return expected when player tie', () => {
      // Arrange
      const betTracks = {
        bets: { ante: 10, aa: 10 },
        combinationResult: { player: { id: 2 }, dealer: { id: 1 } },
      };
      const gameData = { ingame: { a: { betTracks } } };
      const consumer = new SettleGameConsumer({ gameData });
      consumer.normalizeOdds = jest.fn().mockReturnValue({});
      const bet = { ante: 10, aa: 10 };
      compareCombination.mockReturnValue(0);
      const expected = {
        totalBetAmount: betTracks.bets.ante + betTracks.bets.aa,
        totalWin: 20,
        netWin: 10,
        totalLost: 0,
        result: betTracks.combinationResult.player,
        settlementResult: { ante: 0, call: 0, aa: 0 },
      };
      consumer.settleHandPlayerTie = jest.fn((name, odds, bet, result) => {
        result.totalWin = 20;
        result.netWin = 10;
      });
      consumer.settleAABet = jest.fn();

      // Act
      const actual = consumer.calculateBetResult('a', bet, {}, false);

      // Assert
      expect(consumer.settleAABet).toHaveBeenCalledWith('a', {}, bet, expect.any(Object));
      expect(actual).toStrictEqual(expected);
    });

    it('should return expected when player lose', () => {
      // Arrange
      const betTracks = {
        bets: { ante: 10, aa: 10 },
        combinationResult: { player: { id: 2 }, dealer: { id: 1 } },
      };
      const gameData = { ingame: { a: { betTracks } } };
      const consumer = new SettleGameConsumer({ gameData });
      consumer.normalizeOdds = jest.fn().mockReturnValue({});
      const bet = { ante: 10, aa: 10 };
      compareCombination.mockReturnValue(1);
      const expected = {
        totalBetAmount: betTracks.bets.ante + betTracks.bets.aa,
        totalWin: 20,
        netWin: 10,
        totalLost: 0,
        result: betTracks.combinationResult.player,
        settlementResult: { ante: 0, call: 0, aa: 0 },
      };
      consumer.settleHandPlayerLose = jest.fn((name, odds, bet, result) => {
        result.totalWin = 20;
        result.netWin = 10;
      });
      consumer.settleAABet = jest.fn();

      // Act
      const actual = consumer.calculateBetResult('a', bet, {}, false);

      // Assert
      expect(consumer.settleAABet).toHaveBeenCalledWith('a', {}, bet, expect.any(Object));
      expect(actual).toStrictEqual(expected);
    });
  });

  describe('settleHandPlayerWin', () => {
    describe('when dealer qualifies', () => {
      const betTracks = { combinationResult: { player: { id: 3 }, isQualified: true } };
      const gameData = { ingame: { a: { betTracks } } };
      it('should run correctly when have odds', () => {
        // Arrange
        const consumer = new SettleGameConsumer({ gameData });
        const odds = { CallBet: 2, AnteBet: {} };
        const result = { totalWin: 0, netWin: 0, settlementResult: { call: 0 } };
        const bet = { call: 10 };
        consumer.settleDetailBetResult = jest.fn();

        // Act
        consumer.settleHandPlayerWin('a', odds, bet, result);

        // Assert
        expect(result.totalWin).toBe(20);
        expect(result.netWin).toBe(10);
        expect(result.settlementResult.call).toBe(20);
        expect(consumer.settleDetailBetResult).toHaveBeenCalledWith(
          result,
          odds.AnteBet,
          bet,
          betTracks.combinationResult.player,
          'ante',
        );
      });

      it('should run correctly when odds null', () => {
        // Arrange
        const consumer = new SettleGameConsumer({ gameData });
        const odds = { AnteBet: {} };
        const result = { totalWin: 0, netWin: 0, settlementResult: { call: 0 } };
        const bet = {};
        consumer.settleDetailBetResult = jest.fn();

        // Act
        consumer.settleHandPlayerWin('a', odds, bet, result);

        // Assert
        expect(result.totalWin).toBe(0);
        expect(result.netWin).toBe(0);
        expect(result.settlementResult.call).toBe(0);
        expect(consumer.settleDetailBetResult).toHaveBeenCalledWith(
          result,
          odds.AnteBet,
          bet,
          betTracks.combinationResult.player,
          'ante',
        );
      });
    });
    it('should run correctly when dealer does not qualify', () => {
      // Arrange
      const betTracks = { combinationResult: { player: { id: 3 }, isQualified: false } };
      const gameData = { ingame: { a: { betTracks } } };
      const consumer = new SettleGameConsumer({ gameData });
      const result = { totalWin: 0, netWin: 0, settlementResult: { call: 0 } };
      const bet = { call: 10 };
      consumer.settleDetailBetResult = jest.fn();

      // Act
      consumer.settleHandPlayerWin('a', {}, bet, result);

      // Assert
      expect(result.totalWin).toBe(10);
      expect(result.settlementResult.call).toBe(10);
      expect(consumer.settleDetailBetResult).toHaveBeenCalledWith(
        result,
        undefined,
        bet,
        betTracks.combinationResult.player,
        'ante',
      );
    });
  });

  describe('settleHandPlayerTie', () => {
    it('should run correctly when dealer qualifies', () => {
      // Arrange
      const betTracks = { combinationResult: { player: { id: 3 }, isQualified: true } };
      const gameData = { ingame: { a: { betTracks } } };
      const consumer = new SettleGameConsumer({ gameData });
      const odds = { AnteBet: {} };
      const result = { totalWin: 0, settlementResult: { call: 0, ante: 0 } };
      const bet = { call: 10, ante: 10 };
      consumer.settleDetailBetResult = jest.fn();

      // Act
      consumer.settleHandPlayerTie('a', odds, bet, result);

      // Assert
      expect(result.totalWin).toBe(20);
      expect(result.settlementResult.call).toBe(10);
      expect(result.settlementResult.ante).toBe(10);
    });
    it('should run correctly when dealer does not qualify', () => {
      // Arrange
      const betTracks = { combinationResult: { player: { id: 3 }, isQualified: false } };
      const gameData = { ingame: { a: { betTracks } } };
      const consumer = new SettleGameConsumer({ gameData });
      const result = { totalWin: 0, settlementResult: { call: 0, ante: 0 } };
      const bet = { call: 10, ante: 10 };
      consumer.settleDetailBetResult = jest.fn();

      // Act
      consumer.settleHandPlayerTie('a', {}, bet, result);

      // Assert
      expect(result.totalWin).toBe(10);
      expect(result.settlementResult.call).toBe(10);
      expect(consumer.settleDetailBetResult).toHaveBeenCalledWith(
        result,
        undefined,
        bet,
        betTracks.combinationResult.player,
        'ante',
      );
    });
  });

  describe('settleHandPlayerLose', () => {
    it('should run correctly when dealer qualifies', () => {
      // Arrange
      const betTracks = { combinationResult: { player: { id: 3 }, isQualified: true } };
      const gameData = { ingame: { a: { betTracks } } };
      const consumer = new SettleGameConsumer({ gameData });
      const result = { totalLost: 0 };
      const bet = { call: 10, ante: 10 };

      // Act
      consumer.settleHandPlayerLose('a', {}, bet, result);

      // Assert
      expect(result.totalLost).toBe(20);
    });
    it('should run correctly when dealer does not qualify', () => {
      // Arrange
      const betTracks = { combinationResult: { player: { id: 3 }, isQualified: false } };
      const gameData = { ingame: { a: { betTracks } } };
      const consumer = new SettleGameConsumer({ gameData });
      const result = { totalWin: 0, settlementResult: { call: 0 } };
      const bet = { call: 10, ante: 10 };
      consumer.settleDetailBetResult = jest.fn();

      // Act
      consumer.settleHandPlayerLose('a', {}, bet, result);

      // Assert
      expect(result.totalWin).toBe(10);
      expect(result.settlementResult.call).toBe(10);
      expect(consumer.settleDetailBetResult).toHaveBeenCalledWith(
        result,
        undefined,
        bet,
        betTracks.combinationResult.player,
        'ante',
      );
    });
  });

  describe('settleAABet', () => {
    it('should run correctly when isWinAA true', () => {
      // Arrange
      const betTracks = {
        communityCards: [{ rank: 1 }, { rank: 2 }, { rank: 3 }],
        player: [{ rank: 0 }],
      };
      const definition = { settle: jest.fn().mockReturnValue({}) };
      const gameData = { ingame: { a: { betTracks } } };
      const consumer = new SettleGameConsumer({ definition, gameData });
      isWinAA.mockReturnValue(true);
      consumer.settleDetailBetResult = jest.fn();
      const bet = { aa: 10 };
      const result = { totalLost: 0 };

      // Act
      consumer.settleAABet('a', {}, bet, result);

      // Assert
      expect(consumer.settleDetailBetResult).toHaveBeenCalledWith(result, undefined, bet, {}, 'aa');
    });

    it('should run correctly when isWinAA false', () => {
      // Arrange
      const betTracks = {
        communityCards: [{ rank: 1 }, { rank: 2 }, { rank: 3 }],
        player: [{ rank: 0 }],
      };
      const definition = { settle: jest.fn().mockReturnValue({}) };
      const gameData = { ingame: { a: { betTracks } } };
      const consumer = new SettleGameConsumer({ definition, gameData });
      isWinAA.mockReturnValue(false);
      consumer.settleDetailBetResult = jest.fn();
      const bet = { aa: 10 };
      const result = { totalLost: 0 };

      // Act
      consumer.settleAABet('a', {}, bet, result);

      // Assert
      expect(result.totalLost).toBe(10);
    });
  });

  describe('settleDetailBetResult', () => {
    it('should run correctly when have odds', () => {
      // Arrange
      const bet = { ante: 10 };
      const combinationResult = { id: 1 };
      const odds = { 1: 2 };
      const result = { totalWin: 0, netWin: 0, settlementResult: { ante: 0 } };
      const consumer = new SettleGameConsumer({});

      // Act
      consumer.settleDetailBetResult(result, odds, bet, combinationResult, 'ante');

      // Assert
      expect(result.totalWin).toBe(20);
      expect(result.netWin).toBe(10);
      expect(result.settlementResult.ante).toBe(20);
    });

    it('should run correctly when odds empty', () => {
      // Arrange
      const bet = {};
      const combinationResult = { id: 1 };
      const result = { totalWin: 0, netWin: 0, settlementResult: { aa: 0 } };
      const consumer = new SettleGameConsumer({});

      // Act
      consumer.settleDetailBetResult(result, {}, bet, combinationResult, 'aa');

      // Assert
      expect(result.totalWin).toBe(0);
      expect(result.netWin).toBe(0);
      expect(result.settlementResult.aa).toBe(0);
    });
  });

  describe('normalizeOdds', () => {
    it('should return expected', () => {
      // Arrange
      const consumer = new SettleGameConsumer({});
      const odds = {
        CallBet_callBet: 2,
        AnteBet_onePair: 3,
        AnteBet_highCards: 2,
        AABet_pairAces: 4,
      };
      const expected = {
        CallBet: 2,
        AnteBet: { 1: 2, 2: 3 },
        AABet: { 2: 4 },
      };

      // Act
      const actual = consumer.normalizeOdds(odds);

      // Assert
      expect(actual).toStrictEqual(expected);
    });
  });
});
