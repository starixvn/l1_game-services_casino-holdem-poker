import moment from 'moment';
import { Table } from 'sc-game-base';
import Chance from 'chance';
import { cards } from '../../../src/helpers/card';
import { reGenerateDecks } from '../../../src/helpers/deck-helper';
import GameCron from '../../../src/crons/game-cron';
import { decrypt } from '../../../src/helpers/crypto-helper';

jest.mock('cron');
jest.mock('sc-common');
jest.mock('../../../src/helpers/deck-helper');
jest.mock('../../../src/helpers/crypto-helper');

const chance = new Chance();

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
      game.getLastArchiveRound = jest.fn().mockResolvedValue(2);

      // Act
      await game.start();

      // Assert
      expect(game.gameData.roundId).toBe(1);
      expect(game.initBetTracks).toHaveBeenCalled();
    });
  });

  describe('initBetTracks', () => {
    const player = { uid: chance.guid(), name: 'a' };
    const md5Raw = chance.string();

    const generatedResult = {
      dealer: [chance.pickset(cards, 2)],
      player: [chance.pickset(cards, 2)],
      communityCardsGenerated: [chance.pickset(cards, 5)],
      suffix: chance.string(),
    };

    const roundData = {
      id: chance.natural(),
      roundStartTime: new Date(123456),
      uid: player.uid,
      result: {
        communityCards: generatedResult.communityCardsGenerated,
      },
      name: player.name,
      isSwappedOrHold: true,
      encryptedResult: { iv: 'iv', content: 'content' },
      md5: 'md5',
    };

    const game = new GameCron({});
    const deckCards = [chance.pickset(cards, cards.length - 9)];
    game.gameData = { ingame: {}, gameConfigs: {} };

    beforeEach(function () {
      decrypt.mockReturnValueOnce(JSON.stringify(generatedResult)).mockReturnValue(md5Raw);
      reGenerateDecks.mockReturnValue(deckCards);
    });

    describe('when game round is swapped cards', () => {
      it('should set correct ingame data', async () => {
        // Arrange
        const round = {
          ...roundData,
          result: { ...roundData.result, dealer: generatedResult.player },
        };
        game.roundsRepository = {
          find: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue([round]) }),
          }),
        };

        const bet = { cards: generatedResult.dealer, aa: 10, ante: 10, result: { id: 3 } };
        game.betsRepository = {
          findOne: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue(bet) }),
          }),
        };
        const expectedResult = {
          name: round.name,
          betTracks: {
            roundId: round.id,
            roundStartTime: round.roundStartTime,
            uid: round.uid,
            deck: deckCards,
            combinationResult: { player: { ...bet.result } },
            player: bet.cards,
            bets: { aa: bet.aa, ante: bet.ante },
            dealer: [...generatedResult.player],
            communityCards: [...round.result.communityCards],
            communityCardsGenerated: [...generatedResult.communityCardsGenerated],
            resultKey: {
              rawValue: md5Raw,
              formatValue: {
                cards: [
                  ...generatedResult.player,
                  ...generatedResult.dealer,
                  ...generatedResult.communityCardsGenerated,
                ],
                suffix: generatedResult.suffix,
                roundId: roundData.id,
              },
            },
            generatedResult: generatedResult,
            isSwappedOrHold: true,
          },
          betQueue: [],
        };

        // Act
        await game.initBetTracks();

        // Assert
        expect(game.gameData.ingame[player.name]).toStrictEqual(expectedResult);
      });
    });

    describe('when game round is NOT swapped or hold', () => {
      it('should set correct ingame data', async () => {
        // Arrange
        game.roundsRepository = {
          find: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockReturnValue([{ ...roundData, isSwappedOrHold: false }]),
            }),
          }),
        };

        const bet = { cards: generatedResult.player, aa: 10, ante: 10, result: { id: 3 } };
        game.betsRepository = {
          findOne: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue(bet) }),
          }),
        };
        const expectedResult = {
          name: roundData.name,
          betTracks: {
            roundId: roundData.id,
            roundStartTime: roundData.roundStartTime,
            uid: roundData.uid,
            deck: deckCards,
            combinationResult: { player: { ...bet.result } },
            player: bet.cards,
            bets: { aa: bet.aa, ante: bet.ante },
            dealer: [...generatedResult.dealer],
            communityCards: [...roundData.result.communityCards],
            communityCardsGenerated: [...generatedResult.communityCardsGenerated],
            resultKey: {
              rawValue: md5Raw,
              formatValue: {
                cards: [
                  ...generatedResult.player,
                  ...generatedResult.dealer,
                  ...generatedResult.communityCardsGenerated,
                ],
                suffix: generatedResult.suffix,
                roundId: roundData.id,
              },
            },
            generatedResult: generatedResult,
            isSwappedOrHold: false,
          },
          betQueue: [],
        };

        // Act
        await game.initBetTracks();

        // Assert
        expect(game.gameData.ingame[player.name]).toStrictEqual(expectedResult);
      });
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
