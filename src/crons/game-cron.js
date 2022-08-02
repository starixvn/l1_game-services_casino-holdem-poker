import cron from 'cron';
import moment from 'moment';
import { logger } from 'sc-common';
import appConfigs from '../app-configs';
import { reGenerateDecks } from '../helpers/deck-helper';
import { Core } from 'sc-game-base';
import { decrypt } from '../helpers/crypto-helper';
import _ from 'lodash';

export default class GameCron extends Core.Crons.BaseGameCron {
  constructor({
    definition,
    gameData,
    bot,
    settleGameRoundConsumer,
    gameStatusPublisher,
    runningRoundInfoPublisher,
    logService,
    gameConfigsRepository,
    roundsRepository,
    archiveStatusesRepository,
    notificationRepository,
    exchangeRatesRepository,
    currencyGroupGamesRepository,
    partnerConfigRepository,
    currencyGroupRepository,
    currencyRepository,
    betsRepository,
  }) {
    super({
      definition,
      gameData,
      bot,
      settleGameRoundConsumer,
      gameStatusPublisher,
      runningRoundInfoPublisher,
      logService,
      gameConfigsRepository,
      roundsRepository,
      archiveStatusesRepository,
      notificationRepository,
      exchangeRatesRepository,
      currencyGroupGamesRepository,
      partnerConfigRepository,
      currencyGroupRepository,
      currencyRepository,
    });
    this.betsRepository = betsRepository;
  }

  async start() {
    const job = new cron.CronJob(
      '* * * * * *',
      () => this.proceed().catch(logger.logError),
      () => {
        logger.logError(
          `${this.definition.name} unexpectedly stopped because some other tasks halt it.`,
        );
        job.start();
      },
    );

    const lastRound = await this.roundsRepository
      .findOne({}, 'id', { sort: { id: -1 } })
      .lean()
      .exec();

    if (lastRound) {
      this.gameData.roundId = lastRound.id;
    } else {
      this.gameData.roundId = (await this.getLastArchiveRound()) - 1;
    }

    await this.getSettingForNewRound();
    await this.updateExchangeRates();
    await this.initBetTracks();

    job.start();
  }

  async initBetTracks() {
    const runningRounds = await this.roundsRepository.find({ ended: false }).lean().exec();
    const { randomMode } = this.gameData.gameConfigs;

    await Promise.all(
      runningRounds.map(async (round) => {
        const generatedResult = JSON.parse(decrypt(round.encryptedResult));
        const md5RawValue = decrypt(round.encryptedMD5);
        const communityCardsGenerated = generatedResult.communityCardsGenerated || [];
        const dealerCards = round.result.dealer ?? generatedResult.dealer;
        const bet = await this.betsRepository.findOne({ phien: round.id }).lean().exec();
        const playerCards = bet?.cards ?? generatedResult.player;
        const suffix = generatedResult.suffix;
        const usedCards = [
          ...generatedResult.player,
          ...generatedResult.dealer,
          ...generatedResult.communityCardsGenerated,
        ];

        const resultKey = {
          rawValue: md5RawValue,
          formatValue: {
            cards: usedCards,
            suffix,
            roundId: round.id,
          },
        };

        const newPlayer = {
          name: round.name,
          betTracks: {
            roundId: round.id,
            roundStartTime: round.roundStartTime,
            uid: round.uid,
            deck: reGenerateDecks(usedCards, randomMode),
            combinationResult: { player: { ...bet?.result } },
            player: playerCards,
            bets: { aa: bet?.aa, ante: bet?.ante },
            dealer: dealerCards,
            communityCards: [...round.result.communityCards],
            communityCardsGenerated,
            resultKey,
            generatedResult,
            isSwappedOrHold: !!round.isSwappedOrHold,
          },
          betQueue: [],
        };

        this.gameData.ingame[round.name] = newPlayer;
      }),
    );
  }

  async proceed() {
    const { durations } = this.definition;

    if (this.gameData.remainingTime === durations.wholeRound) {
      await this.checkGameStatus();
      this.bot && (await this.bot.reset());
    }

    if (!this.gameData.disabled) {
      if (this.gameData.remainingTime % durations.botFrequency === 0) {
        this.bot && (await this.bot.run());
      }
      this.gameData.remainingTime--;
    }

    if (this.gameData.remainingTime < 0) {
      this.gameData.remainingTime = durations.wholeRound;

      const expiredTime = moment.utc().subtract(appConfigs.roundMaxDurationInMinutes, 'minutes');
      await Promise.all(
        Object.values(this.gameData.ingame)
          .filter(
            (userBet) =>
              userBet.betTracks && moment(userBet.betTracks.roundStartTime) < expiredTime,
          )
          .map((userBet) => this.settleGameRoundConsumer.settleRound(userBet.name, true)),
      );
    }
  }
}
