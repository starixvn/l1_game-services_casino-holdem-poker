import moment from 'moment';
import { Table } from "sc-game-base";

import { reGenerateDecks } from '../../../src/helpers/deck-helper';
import GameCron from '../../../src/crons/game-cron';
import { decrypt } from '../../../src/helpers/crypto-helper';

jest.mock('cron');
jest.mock('sc-common');
jest.mock('../../../src/helpers/deck-helper');
jest.mock('../../../src/helpers/crypto-helper');

describe('Game Cron test', () => {
  it('inherit Table.Crons.TableGameCron', () => {
    // Act
    const game = new GameCron({});

    // Assert
    expect(game instanceof Table.Crons.TableGameCron);
  });

  describe('start', () => {
    it('should set last roundId when have last round', async () => {
      // Arrange
      const lastRound = { id: 10 };
      const game = new GameCron({});
      game.getSettingForNewRound = jest.fn();
      game.updateExchangeRates = jest.fn();
      game.proceed = jest.fn();
      game.initBetTracks = jest.fn();
      game.roundsRepository = {
        findOne: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue(lastRound) }),
        }),
      };
      game.gameData = { roundId: 0 };

      // Act
      await game.start();

      // Assert
      expect(game.gameData.roundId).toBe(10);
      expect(game.initBetTracks).toHaveBeenCalled();
    });

    it('should run correctly when last round null', async () => {
      // Arrange
      const game = new GameCron({});
      game.getSettingForNewRound = jest.fn();
      game.updateExchangeRates = jest.fn();
      game.proceed = jest.fn();
      game.initBetTracks = jest.fn();
      game.roundsRepository = {
        findOne: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue(null) }),
        }),
      };
      game.gameData = { roundId: 1 };

      // Act
      await game.start();

      // Assert
      expect(game.gameData.roundId).toBe(1);
      expect(game.initBetTracks).toHaveBeenCalled();
    });
  });

  describe('initBetTracks', () => {
    const player = { uid: 1, name: 'a' };
    const cardsRaw = '{"dealer":[{"rank": 1}], "communityCardsGenerated":[{"rank": 1}]}';
    const resultKeyRaw = "[7,8,9]aaa";

    describe('when data is new format with encrypt data', () => {
      const roundWithNewFormat = {
        id: 2,
        roundStartTime: new Date(123456),
        uid: player.uid,
        result: {
          communityCards: [{ rank: 1 }, { rank: 2 }, { rank: 3 }],
        },
        cardsRaw: { iv: "iv", content: "content" },
        name: player.name,
      };

      beforeEach(function () {
        decrypt.mockReturnValueOnce(cardsRaw).mockReturnValueOnce(resultKeyRaw);
      });

      it('should set ingame when round and bet are exist.', async () => {
        // Arrange
        const game = new GameCron({});
        game.gameData = { ingame: {} };
        game.roundsRepository = {
          find: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue([roundWithNewFormat]) }),
          }),
        };

        const bet = { cards: [{ rank: 4 }, { rank: 5 }], aa: 10, ante: 10, result: { id: 3 } };
        game.betsRepository = {
          findOne: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue(bet) }),
          }),
        };
        const deckCards = [{ rank: 0 }];
        reGenerateDecks.mockReturnValue(deckCards);
        const newPlayer = {
          name: roundWithNewFormat.name,
          betTracks: {
            roundId: roundWithNewFormat.id,
            roundStartTime: roundWithNewFormat.roundStartTime,
            uid: roundWithNewFormat.uid,
            deck: deckCards,
            combinationResult: { player: { ...bet.result } },
            player: bet.cards,
            bets: { aa: bet.aa, ante: bet.ante },
            dealer: [{ rank: 1 }],
            communityCards: [...roundWithNewFormat.result.communityCards],
            communityCardsGenerated: [{ rank: 1 }],
            resultKey: { rawValue: resultKeyRaw, formatValue: { cards: [{ rank: 4 }, { rank: 5 }, { rank: 1 }, { rank: 1 }], suffix: "aaa" } }
          },
          betQueue: [],
        };

        // Act
        await game.initBetTracks();

        // Assert
        expect(game.gameData.ingame[player.name]).toStrictEqual(newPlayer);
      });

      it('should set ingame when round is exist and bet does not exist.', async () => {
        // Arrange
        const game = new GameCron({});
        game.gameData = { ingame: {} };
        game.roundsRepository = {
          find: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue([roundWithNewFormat]) }),
          }),
        };
        game.betsRepository = {
          findOne: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue(undefined) }),
          }),
        };
        const deckCards = [{ rank: 0 }];
        reGenerateDecks.mockReturnValue(deckCards);
        const newPlayer = {
          name: roundWithNewFormat.name,
          betTracks: {
            roundId: roundWithNewFormat.id,
            roundStartTime: roundWithNewFormat.roundStartTime,
            uid: roundWithNewFormat.uid,
            deck: deckCards,
            combinationResult: { player: {} },
            player: [],
            bets: { aa: undefined, ante: undefined },
            dealer: [{ rank: 1 }],
            communityCards: [...roundWithNewFormat.result.communityCards],
            communityCardsGenerated: [{ rank: 1 }],
            resultKey: { rawValue: resultKeyRaw, formatValue: { cards: [{ rank: 1 }, { rank: 1 }], suffix: "aaa" } }
          },
          betQueue: [],
        };

        // Act
        await game.initBetTracks();

        // Assert
        expect(game.gameData.ingame[player.name]).toStrictEqual(newPlayer);
      });

    });


    it('should set ingame when data is old format.', async () => {
      // Arrange
      const game = new GameCron({});
      game.gameData = { ingame: {} };
      const roundWithOldFormat = {
        id: 2,
        roundStartTime: new Date(123456),
        uid: player.uid,
        result: {
          dealer: [{ rank: 1 }],
          communityCards: [{ rank: 1 }, { rank: 2 }, { rank: 3 }],
        },
        communityCardsGenerated: [{ rank: 1 }],
        cardsRaw: { iv: "iv", content: "content" },
        resultKeyRaw: "[7,8,9]aaa",
        name: player.name,
      };

      game.roundsRepository = {
        find: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue([roundWithOldFormat]) }),
        }),
      };
      game.betsRepository = {
        findOne: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue(undefined) }),
        }),
      };

      const deckCards = [{ rank: 0 }];
      reGenerateDecks.mockReturnValue(deckCards);
      const newPlayer = {
        name: roundWithOldFormat.name,
        betTracks: {
          roundId: roundWithOldFormat.id,
          roundStartTime: roundWithOldFormat.roundStartTime,
          uid: roundWithOldFormat.uid,
          deck: deckCards,
          combinationResult: { player: {} },
          player: [],
          bets: { aa: undefined, ante: undefined },
          dealer: [{ rank: 1 }],
          communityCards: [...roundWithOldFormat.result.communityCards],
          communityCardsGenerated: [{ rank: 1 }],
          resultKey: { rawValue: resultKeyRaw, formatValue: { cards: [{ rank: 1 }, { rank: 1 }], suffix: "aaa" } }
        },
        betQueue: [],
      };

      // Act
      await game.initBetTracks();

      // Assert
      expect(game.gameData.ingame[player.name]).toStrictEqual(newPlayer);
    });
  });

  describe('proceed', () => {
    const definition = {
      durations: {
        wholeRound: 60,
        botFrequency: 29,
      },
    };
    it('should run correctly when remainingTime equal wholeRound and game disabled', async () => {
      // Arrange
      const game = new GameCron({ definition });
      game.gameData = {
        remainingTime: 60,
        disabled: true,
      };
      game.bot = { reset: jest.fn() };
      game.checkGameStatus = jest.fn();

      // Act
      await game.proceed();

      // Assert
      expect(game.checkGameStatus).toHaveBeenCalled();
      expect(game.bot.reset).toHaveBeenCalled();
      expect(game.gameData.remainingTime).toBe(60);
    });

    it('should decrease remainingTime when disabled false', async () => {
      // Arrange
      const game = new GameCron({ definition });
      game.gameData = {
        remainingTime: 50,
        disabled: false,
      };

      // Act
      await game.proceed();

      // Assert
      expect(game.gameData.remainingTime).toBe(49);
    });

    it('should decrease remainingTime and run bot when disabled false and remainingTime equal botFrequency', async () => {
      // Arrange
      const game = new GameCron({ definition });
      game.gameData = {
        remainingTime: 29,
        disabled: false,
      };
      game.bot = { run: jest.fn() };

      // Act
      await game.proceed();

      // Assert
      expect(game.bot.run).toHaveBeenCalled();
      expect(game.gameData.remainingTime).toBe(28);
    });

    it('should settle round when round expire', async () => {
      // Arrange
      const game = new GameCron({ definition });
      game.gameData = {
        remainingTime: -1,
        disabled: true,
        ingame: {
          a: {
            betTracks: { roundStartTime: new Date(123456789) },
            name: 'a',
          },
        },
      };
      game.settleGameRoundConsumer = { settleRound: jest.fn() };
      moment.now = function () {
        return +new Date(999999999);
      };

      // Act
      await game.proceed();

      // Assert
      expect(game.gameData.remainingTime).toBe(definition.durations.wholeRound);
      expect(game.settleGameRoundConsumer.settleRound).toHaveBeenCalledWith('a', true);
    });
  });
});
