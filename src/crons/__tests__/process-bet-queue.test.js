import { Core } from "sc-game-base";
import ProcessBetQueue from '../process-bet-queue';
import gameSettings from '../../game-settings';
import { deal, generateDecks, reGenerateDecks } from '../../helpers/deck-helper';
import { isQualified } from '../../helpers/result-helper';

jest.mock('sc-common');
jest.mock('../../helpers/result-helper');
jest.mock('../../helpers/deck-helper');

describe('Process bet queue test', () => {
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
  it('inherit Core.Crons.ProcessBetQueue', () => {
    // Act
    const process = new ProcessBetQueue({});

    // Assert
    expect(process instanceof Core.Crons.ProcessBetQueue);
  });

  describe('proceedBet', () => {
    it('should logError when have error', async () => {
      // Arrange
      const error = new Error('error');
      const process = new ProcessBetQueue({});
      const betTrack = { action: gameSettings.actions.deal };
      process.processDeal = jest.fn(() => {
        throw error;
      });
      process.logService = { logError: jest.fn() };

      // Act
      await process.proceedBet({}, betTrack);

      // Assert
      expect(process.logService.logError).toHaveBeenCalledWith(error);
    });

    it('should call processDeal when action deal', async () => {
      // Arrange
      const process = new ProcessBetQueue({});
      const betTrack = { action: gameSettings.actions.deal, payload: {} };
      process.processDeal = jest.fn();

      // Act
      await process.proceedBet({}, betTrack);

      // Assert
      expect(process.processDeal).toHaveBeenCalledWith({}, betTrack.payload);
    });

    it('should call processDoubleCall when action doubleCall', async () => {
      // Arrange
      const process = new ProcessBetQueue({});
      const betTrack = { action: gameSettings.actions.doubleCall };
      process.processDoubleCall = jest.fn();

      // Act
      await process.proceedBet({}, betTrack);

      // Assert
      expect(process.processDoubleCall).toHaveBeenCalledWith({});
    });

    it('should settle round when action fold', async () => {
      // Arrange
      const process = new ProcessBetQueue({});
      const betTrack = { action: gameSettings.actions.fold };
      const player = { profile: { name: 'a' } };
      process.settleGameRoundConsumer = { settleRound: jest.fn() };

      // Act
      await process.proceedBet(player, betTrack);

      // Assert
      expect(process.settleGameRoundConsumer.settleRound).toHaveBeenCalledWith(
        player.profile.name,
        true,
      );
    });
  });

  describe('buildPresetCards', () => {
    it('should return expected when resultFromAdmin has value', () => {
      // Arrange
      const process = new ProcessBetQueue({});
      const resultFromAdmin = {
        player: [{ rank: 1 }, { rank: 1 }],
        dealer: [{ rank: 2 }, { rank: 2 }],
        communityCards: [{ rank: 3 }],
      };
      const expected = [
        resultFromAdmin.player[0],
        resultFromAdmin.dealer[0],
        resultFromAdmin.player[1],
        resultFromAdmin.dealer[1],
        resultFromAdmin.communityCards[0],
      ];

      // Act
      const actual = process.buildPresetCards(resultFromAdmin);

      // Assert
      expect(actual).toStrictEqual(expected);
    });

    it('should return expected when resultFromAdmin empty', () => {
      // Arrange
      const process = new ProcessBetQueue({});
      const unusedCards = [{ rank: 1 }, { rank: 1 }, { rank: 2 }, { rank: 2 }, { rank: 3 }];
      reGenerateDecks.mockReturnValue(unusedCards);
      const expected = [{ rank: 1 }, { rank: 1 }, { rank: 2 }, { rank: 2 }];

      // Act
      const actual = process.buildPresetCards({});

      // Assert
      expect(actual).toStrictEqual(expected);
    });
  });

  describe('getPresetCards', () => {
    it('should logError and return empty array when buildPresetCards error', () => {
      // Arrange
      const error = new Error('error');
      const player = { profile: { name: 'a' } };
      const gameData = { resultFromAdmin: { roundName: player.profile.name } };
      const logService = { logError: jest.fn() };
      const process = new ProcessBetQueue({ gameData, logService });
      process.buildPresetCards = jest.fn(() => {
        throw error;
      });

      // Act
      const actual = process.getPresetCards(player);

      // Assert
      expect(actual).toBeArrayOfSize(0);
    });

    it('should return empty array when resultFromAdmin has roundName not equal player name', () => {
      // Arrange
      const player = { profile: { name: 'a' } };
      const gameData = { resultFromAdmin: { roundName: 'b' } };
      const process = new ProcessBetQueue({ gameData });

      // Act
      const actual = process.getPresetCards(player);

      // Assert
      expect(actual).toBeArrayOfSize(0);
    });

    it('should return expected when resultFromAdmin has roundName equal player name', () => {
      // Arrange
      const player = { profile: { name: 'a' } };
      const gameData = { resultFromAdmin: { roundName: player.profile.name } };
      const process = new ProcessBetQueue({ gameData });
      process.buildPresetCards = jest.fn().mockReturnValue([{ rank: 1 }]);

      // Act
      const actual = process.getPresetCards(player);

      // Assert
      expect(actual).toStrictEqual([{ rank: 1 }]);
      expect(gameData.resultFromAdmin).toBeNull();
    });
  });

  describe('processDeal', () => {
    const player = { UID: 1, profile: { name: 'a' }, session: {} };
    const definition = { id: 39, choicesMapper: { deal: 1 } };

    it('should call handleSuccessDeal when placeBet successfully', async () => {
      const betTracks = {};
      const gameData = { roundId: 1, ingame: { [player.profile.name]: { betTracks } } };
      const process = new ProcessBetQueue({ definition, gameData });
      const payload = { aa: 10, ante: 50 };
      const betInfo = {
        amount: payload.aa + payload.ante,
        gameId: definition.id,
        gameRoundId: 2,
        choiceId: definition.choicesMapper[gameSettings.actions.deal],
      };
      const apiResult = { isOk: true, response: { red: 1000 } };
      process.placeBet = jest
        .fn({ id: player.UID, session: player.session }, betInfo)
        .mockReturnValue(apiResult);
      process.handleSuccessDeal = jest.fn();

      // Act
      await process.processDeal(player, payload);

      // Assert
      expect(betTracks.player).toBeArrayOfSize(0);
      expect(betTracks.dealer).toBeArrayOfSize(0);
      expect(betTracks.communityCards).toBeArrayOfSize(0);
      expect(betTracks.uid).toBe(player.UID);
      expect(betTracks.combinationResult).toStrictEqual({});
      expect(betTracks.bets).toStrictEqual(payload);
      expect(process.handleSuccessDeal).toHaveBeenCalledWith(player, apiResult.response, 2);
      expect(betTracks.isDealing).toBeFalse();
    });

    it('should call handleSuccessDeal when placeBet unsuccessfully', async () => {
      const betTracks = {};
      const gameData = { roundId: 1, ingame: { [player.profile.name]: { betTracks } } };
      const process = new ProcessBetQueue({ definition, gameData });
      const payload = { aa: 10, ante: 50 };
      const betInfo = {
        amount: payload.aa + payload.ante,
        gameId: definition.id,
        gameRoundId: 2,
        choiceId: definition.choicesMapper[gameSettings.actions.deal],
      };
      const apiResult = { isOk: false, response: {} };
      process.placeBet = jest
        .fn({ id: player.UID, session: player.session }, betInfo)
        .mockReturnValue(apiResult);
      process.handleFailPlaceBetResponse = jest.fn();

      // Act
      await process.processDeal(player, payload);

      // Assert
      expect(betTracks.player).toBeArrayOfSize(0);
      expect(betTracks.dealer).toBeArrayOfSize(0);
      expect(betTracks.communityCards).toBeArrayOfSize(0);
      expect(betTracks.uid).toBe(player.UID);
      expect(betTracks.combinationResult).toStrictEqual({});
      expect(betTracks.bets).toStrictEqual(payload);
      expect(process.handleFailPlaceBetResponse).toHaveBeenCalledWith(
        player,
        apiResult.response,
        gameSettings.actions.deal,
      );
      expect(betTracks.isDealing).toBeFalse();
    });
  });

  describe('handleSuccessDeal', () => {
    it('should run correctly', async () => {
      // Arrange
      const player = { UID: 1, profile: { name: 'a' } };
      const betTracks = {
        bets: { aa: 10, ante: 100 },
        player: [],
        communityCards: [],
        combinationResult: {},
      };
      const gameData = { resultKey, md5, ingame: { [player.profile.name]: { betTracks } } };
      const publisher = { publishToUser: jest.fn() };
      const process = new ProcessBetQueue({ gameData, publisher });
      process.getPresetCards = jest.fn().mockReturnValue([]);
      const deck = [{ rank: 1 }, { rank: 2 }];
      generateDecks.mockReturnValue(deck);
      const newRound = { id: 3 };
      process.createRound = jest.fn(player, newRound.id).mockReturnValue(newRound);
      process.createBet = jest.fn();
      const data = {
        deal: {
          roundId: newRound.id,
          player: betTracks.player,
          communityCards: betTracks.communityCards,
          combinationResult: betTracks.combinationResult,
          totalAmount: 110,
          choices: betTracks.bets,
        },
        endBet: betTracks.bets.ante + betTracks.bets.aa,
        user: {},
        md5: { key: "123" }
      };

      // Act
      await process.handleSuccessDeal(player, {}, newRound.id);

      // Assert
      expect(betTracks.deck).toStrictEqual(deck);
      expect(deal).toHaveBeenCalled();
      expect(betTracks.roundId).toBe(newRound.id);
      expect(betTracks.roundStartTime).toEqual(new Date(123456));
      expect(process.createBet).toHaveBeenCalledWith(player);
      expect(publisher.publishToUser).toHaveBeenCalledWith(player.UID, data);
    });
  });

  describe('createRound', () => {
    it('should return expected', async () => {
      const player = { UID: 1, profile: { name: 'profile' } };
      const betTracks = { player: [{ rank: 2 }], dealer: [{ rank: 1 }], communityCards: [{ rank: 2 }] };
      const result = { dealer: betTracks.dealer, communityCards: betTracks.communityCards };
      const gameData = {
        exchangeRates: { exId: 1 },
        gameConfigs: { odds: { callBet: 2 } },
        ingame: { [player.profile.name]: { betTracks } },
      };
      const
        definition = {
          generateResult: jest.fn().mockReturnValue(result),
          settle: jest.fn().mockReturnValue({ id: 1 }),
        };

      const expected = {
        id: 10,
        result,
        roundStartTime: new Date(123456),
        uid: player.UID,
        name: player.profile.name,
        odds: gameData.gameConfigs.odds,
      };
      const roundsRepository = { create: jest.fn().mockReturnValue(expected) };
      const process = new ProcessBetQueue({ definition, gameData, roundsRepository });

      // Act
      const actual = await process.createRound(player, 10);

      // Assert
      expect(actual).toStrictEqual(expected);
    });
  });

  describe('createBet', () => {
    it('should run correctly', async () => {
      // Arrange
      const player = {
        UID: 1,
        profile: { name: 'profile' },
        session: { memberId: 123, siteId: 2 },
      };
      const betTracks = {
        roundId: 1,
        player: [{ rank: 1 }],
        communityCards: [{ rank: 2 }],
        bets: { aa: 10, ante: 100 },
        combinationResult: {},
      };
      const gameData = {
        ingame: { [player.profile.name]: { betTracks } },
      };
      const definition = { settle: jest.fn().mockReturnValue({ id: 1 }) };
      const betsRepository = { create: jest.fn() };
      const process = new ProcessBetQueue({ definition, gameData, betsRepository });
      const data = {
        uid: player.UID,
        name: player.profile.name,
        phien: betTracks.roundId,
        aa: betTracks.bets.aa,
        ante: betTracks.bets.ante,
        cards: betTracks.player,
        bet: betTracks.bets.aa + betTracks.bets.ante,
        result: { id: 1 },
        time: new Date(123456),
        memberId: player.session.memberId,
        siteId: player.session.siteId,
      };

      // Act
      await process.createBet(player);

      // Assert
      expect(betTracks.combinationResult.player).toStrictEqual({ id: 1 });
      expect(betsRepository.create).toHaveBeenCalledWith(data);
    });
  });

  describe('processDoubleCall', () => {
    const player = { UID: 1, profile: { name: 'profile' }, session: {} };
    const definition = { id: 39, choicesMapper: { deal: 1 } };

    it('should call handleSuccessCall when placeBet successfully', async () => {
      const betTracks = {
        roundId: 1,
        bets: { aa: 10, ante: 100 },
      };
      const gameData = {
        ingame: { [player.profile.name]: { betTracks } },
      };
      const process = new ProcessBetQueue({ definition, gameData });
      const betInfo = {
        amount: betTracks.bets.ante * 2,
        gameId: definition.id,
        gameRoundId: betTracks.roundId,
        choiceId: definition.choicesMapper[gameSettings.actions.doubleCall],
      };
      const apiResult = { isOk: true, response: { red: 1000 } };
      process.placeBet = jest
        .fn({ id: player.UID, session: player.session }, betInfo)
        .mockReturnValue(apiResult);
      process.handleSuccessCall = jest.fn();

      // Act
      await process.processDoubleCall(player);

      // Assert
      expect(process.handleSuccessCall).toHaveBeenCalledWith(
        player,
        betInfo.amount,
        apiResult.response,
      );
    });

    it('should call handleSuccessCall when placeBet unsuccessfully', async () => {
      const betTracks = {
        roundId: 1,
        bets: { aa: 10, ante: 100 },
      };
      const gameData = {
        ingame: { [player.profile.name]: { betTracks } },
      };
      const process = new ProcessBetQueue({ definition, gameData });
      const betInfo = {
        amount: betTracks.bets.ante * 2,
        gameId: definition.id,
        gameRoundId: betTracks.roundId,
        choiceId: definition.choicesMapper[gameSettings.actions.doubleCall],
      };
      const apiResult = { isOk: false, response: { red: 1000 } };
      process.placeBet = jest
        .fn({ id: player.UID, session: player.session }, betInfo)
        .mockReturnValue(apiResult);
      process.handleFailPlaceBetResponse = jest.fn();

      // Act
      await process.processDoubleCall(player);

      // Assert
      expect(process.handleFailPlaceBetResponse).toHaveBeenCalledWith(
        player,
        apiResult.response,
        gameSettings.actions.doubleCall,
      );
    });
  });

  describe('handleSuccessCall', () => {
    it('should run correctly', async () => {
      // Arrange
      const player = { profile: { name: 'a' }, session: { partnerId: "1W" } };
      const betTracks = {
        roundId: 1,
        combinationResult: { player: { id: 3 } },
        communityCards: [],
        dealer: [],
        bets: { ante: 100, call: 100 },
      };
      const gameData = {
        ingame: { [player.profile.name]: { betTracks } },
      };
      const betsRepository = { update: jest.fn() };
      const publisher = { publishToUser: jest.fn() };
      const settleGameRoundConsumer = { settleRound: jest.fn() };
      const process = new ProcessBetQueue({
        gameData,
        betsRepository,
        publisher,
        settleGameRoundConsumer,
      });
      process.updateBetTracksAfterCall = jest.fn();
      const call = {
        communityCards: betTracks.communityCards,
        combinationResult: betTracks.combinationResult,
        dealer: betTracks.dealer,
        totalAmount: 200,
        choices: betTracks.bets,
      };

      // Act
      await process.handleSuccessCall(player, 100, {});

      // Assert
      expect(process.updateBetTracksAfterCall).toHaveBeenCalledWith(player, 100);
      expect(betsRepository.update).toHaveBeenCalledWith(
        { phien: betTracks.roundId },
        { $inc: { call: 100, bet: 100 }, result: betTracks.combinationResult.player, callTime: new Date(123456) },
      );
      expect(publisher.publishToUser).toHaveBeenCalledWith(player.UID, {
        endBet: 100,
        user: {},
        call,
      });
      expect(settleGameRoundConsumer.settleRound).toHaveBeenCalledWith(player.profile.name);
    });
  });

  describe('updateBetTracksAfterCall', () => {
    it('should run correctly', async () => {
      // Arrange
      const player = { profile: { name: 'a' }, session: { partnerId: "1W" } };
      const result = { dealer: [{ rank: 1 }], communityCards: [{ rank: 2 }] };
      const combinationResult = { id: 1 };
      const definition = {
        settle: jest.fn().mockReturnValue(combinationResult),
      };

      const betTracks = {
        communityCards: [{ rank: 2 }],
        dealer: [],
        deck: [],
        player: [{ rank: 0 }],
        bets: { ante: 100 },
        combinationResult: {},
      };
      const gameData = { ingame: { [player.profile.name]: { betTracks } } };

      const expected = {
        resultGenerated: result
      };

      const process = new ProcessBetQueue({ definition, gameData });
      process.roundsRepository = {
        findOne: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue(expected) }),
        }),
      };
      isQualified.mockReturnValue(false);

      // Act
      await process.updateBetTracksAfterCall(player, 100);

      // Assert
      expect(betTracks.bets.call).toBe(100);
      expect(betTracks.dealer).toStrictEqual(result.dealer);
      expect(betTracks.communityCards).toStrictEqual(result.communityCards);
      expect(definition.settle).toHaveBeenCalledWith([{ rank: 0 }, { rank: 2 }]);
      expect(definition.settle).toHaveBeenCalledWith([{ rank: 1 }, { rank: 2 }]);
      expect(betTracks.combinationResult.player).toStrictEqual(combinationResult);
      expect(betTracks.combinationResult.dealer).toStrictEqual(combinationResult);
      expect(betTracks.combinationResult.isQualified).toBeFalse();
    });
  });

  describe('handleFailPlaceBetResponse', () => {
    const player = { session: { language: '' } };

    it('should run correctly', () => {
      // Arrange
      const response = { cannotProcessBet: {} };
      const process = new ProcessBetQueue({});
      process.handleFailedBet = jest.fn();

      // Act
      process.handleFailPlaceBetResponse(player, response, gameSettings.actions.deal);

      // Assert
      expect(process.handleFailedBet).toHaveBeenCalledWith(
        { session: { language: "" } },
        "SB1905",
        {
          betChoice: gameSettings.actions.deal,
        });
    });

    it('should run correctly', () => {
      // Arrange
      const response = {};
      const process = new ProcessBetQueue({});
      process.handleFailedBet = jest.fn();

      // Act
      process.handleFailPlaceBetResponse(player, response, gameSettings.actions.deal);

      // Assert
      expect(process.handleFailedBet).toHaveBeenCalledWith(
        player,
        {},
        {
          betChoice: gameSettings.actions.deal,
        },
      );
    });
  });
});
