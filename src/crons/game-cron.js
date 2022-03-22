import cron from 'cron';
import moment from 'moment';
import { logger } from 'sc-common';
import appConfigs from '../app-configs';
import { reGenerateDecks } from '../helpers/deck-helper';
import { Core } from "sc-game-base";
import { decrypt } from "../helpers/crypto-helper";

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
    }

    await this.getSettingForNewRound();
    await this.updateExchangeRates();
    await this.initBetTracks();

    job.start();
  }

  async initBetTracks() {
    const runningRounds = await this.roundsRepository.find({ ended: false }).lean().exec();

    await Promise.all(
      runningRounds.map(async (round) => {
        let dealerCards =[], communityCardsGenerated = [], resultKeyRaw = round.resultKeyRaw;

        if(round.result.dealer)
        {
          dealerCards = round.result.dealer;
          communityCardsGenerated = round.communityCardsGenerated;
        }
        else
        {
          const cards = JSON.parse(decrypt(round.cardsRaw));
          dealerCards = cards.dealer;
          communityCardsGenerated = cards.communityCardsGenerated;
          resultKeyRaw = decrypt(round.resultKeyRaw);
        }

        const usedCards = [...round.result.communityCards, ...dealerCards];
        const bet = await this.betsRepository.findOne({ phien: round.id }).lean().exec();
        const playerCards = bet?.cards ?? [];
        usedCards.push(...playerCards);

        const suffix = resultKeyRaw.split("]")[1];
        const resultKey = { rawValue: resultKeyRaw, formatValue: { cards: playerCards.concat(dealerCards).concat(communityCardsGenerated), suffix } };

        const newPlayer = {
          name: round.name,
          betTracks: {
            roundId: round.id,
            roundStartTime: round.roundStartTime,
            uid: round.uid,
            deck: reGenerateDecks(usedCards),
            combinationResult: { player: { ...bet?.result } },
            player: playerCards,
            bets: { aa: bet?.aa, ante: bet?.ante },
            dealer: dealerCards,
            communityCards: [...round.result.communityCards],
            communityCardsGenerated,
            resultKey
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
