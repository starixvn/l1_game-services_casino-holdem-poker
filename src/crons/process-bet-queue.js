import { Core } from 'sc-game-base';
import { deal, generateDecks, reGenerateDecks } from '../helpers/deck-helper';
import { isQualified } from '../helpers/result-helper';
import gameSettings from '../game-settings';
import { helpers } from 'sc-common';
import { createHashMD5, randomString, encrypt } from '../helpers/crypto-helper';
import { cardToString } from '../helpers/card';

export default class ProcessBetQueue extends Core.Crons.ProcessBetQueue {
  constructor({
    definition,
    gameData,
    placeBetPublisher,
    placeBet,
    logService,
    betsRepository,
    betLogsRepository,
    userInfosRepository,
    baseMetrics,
    roundsRepository,
    publisher,
    settleGameRoundConsumer,
  }) {
    super({
      definition,
      gameData,
      placeBetPublisher,
      placeBet,
      logService,
      betsRepository,
      betLogsRepository,
      userInfosRepository,
      baseMetrics,
    });
    this.roundsRepository = roundsRepository;
    this.publisher = publisher;
    this.settleGameRoundConsumer = settleGameRoundConsumer;
  }
  async proceedBet(player, betTrack) {
    try {
      switch (betTrack.action) {
        case gameSettings.actions.deal:
          await this.processDeal(player, betTrack.payload);
          break;
        case gameSettings.actions.doubleCall:
          await this.processDoubleCall(player);
          break;
        case gameSettings.actions.fold:
          await this.settleGameRoundConsumer.settleRound(player.profile.name, true);
          break;
        case gameSettings.actions.hold:
          await this.processHold(player);
          break;
        case gameSettings.actions.swap:
          await this.processSwap(player);
          break;
      }
    } catch (e) {
      this.logService.logError(e);
    }
  }

  buildPresetCards(resultFromAdmin) {
    const { randomMode } = this.gameData.gameConfigs;
    const player = resultFromAdmin.player || [];
    const dealer = resultFromAdmin.dealer || [];
    const communityCards = resultFromAdmin.communityCards || [];
    const unusedCards = reGenerateDecks(player.concat(dealer, communityCards), randomMode);
    const cards = [];
    cards.push(player[0] || unusedCards.shift());
    cards.push(dealer[0] || unusedCards.shift());
    cards.push(player[1] || unusedCards.shift());
    cards.push(dealer[1] || unusedCards.shift());
    return cards.concat(communityCards);
  }

  getPresetCards(player) {
    let presetCards = [];
    try {
      if (
        this.gameData.resultFromAdmin &&
        this.gameData.resultFromAdmin.roundName === player.profile.name
      ) {
        presetCards = this.buildPresetCards(this.gameData.resultFromAdmin);
        this.gameData.resultFromAdmin = null;
      }
    } catch (e) {
      this.logService.logError(e);
    }
    return presetCards;
  }

  async processDeal(player, payload) {
    const { betTracks } = this.gameData.ingame[player.profile.name];
    betTracks.player = [];
    betTracks.dealer = [];
    betTracks.communityCards = [];
    betTracks.uid = player.UID;
    betTracks.combinationResult = {};
    betTracks.bets = { ...payload };
    betTracks.isDealing = true;
    betTracks.isSwappedOrHold = false;

    this.gameData.roundId++;

    const roundId = this.gameData.roundId;
    const betInfo = {
      amount: payload.aa + payload.ante,
      gameId: this.definition.id,
      gameRoundId: roundId,
      choiceId: this.definition.choicesMapper[gameSettings.actions.deal],
      freeBet: payload.freeBet,
      clientSentTime: payload.time ?? new Date(),
    };

    const apiResult = await this.placeBet({ id: player.UID, session: player.session }, betInfo);
    const { response } = apiResult;

    if (apiResult.isOk) {
      await this.handleSuccessDeal(player, response, roundId);
    } else {
      this.handleFailPlaceBetResponse(player, response, gameSettings.actions.deal);
    }

    betTracks.isDealing = false;
  }

  async handleSuccessDeal(player, balance, roundId) {
    const { randomMode } = this.gameData.gameConfigs;
    const presetCards = this.getPresetCards(player);
    const { betTracks } = this.gameData.ingame[player.profile.name];

    betTracks.deck = generateDecks(presetCards, randomMode);
    deal(betTracks);

    const newRound = await this.createRound(player, roundId);
    betTracks.roundId = newRound.id;
    betTracks.roundStartTime = new Date();
    await this.createBet(player);

    if (player.profile.minBet !== balance.minBet || player.profile.maxBet !== balance.maxBet) {
      await this.updateUserStakeLevel(player, balance.minBet, balance.maxBet);
    }

    this.publisher.publishToUser(player.UID, {
      deal: {
        roundId: betTracks.roundId,
        communityCards: betTracks.communityCards,
        combinationResult: {
          player: this.definition.settle(betTracks.communityCards, 3),
        },
        totalAmount: Object.values(betTracks.bets).reduce((total, item) => total + item),
        choices: betTracks.bets,
      },
      endBet: betTracks.bets.ante + betTracks.bets.aa,
      user: balance,
      md5: { key: betTracks.md5 },
    });
  }

  async createRound(player, roundId) {
    const { betTracks } = this.gameData.ingame[player.profile.name];
    const { odds } = this.gameData.gameConfigs;

    const communityCardsGenerated = this.definition.generateResult(
      betTracks.communityCards,
      betTracks.deck,
    );

    const resultKeySuffix = randomString();
    const generatedResult = {
      communityCardsGenerated,
      dealer: betTracks.dealer,
      player: betTracks.player,
      suffix: resultKeySuffix,
    };

    betTracks.communityCardsGenerated = communityCardsGenerated;

    const md5Raw = this.createMD5Raw(generatedResult, roundId);
    const md5 = createHashMD5(md5Raw);

    betTracks.generatedResult = generatedResult;
    betTracks.md5 = md5;
    betTracks.resultKey = {
      rawValue: md5Raw,
      formatValue: {
        cards: betTracks.player.concat(betTracks.dealer).concat(communityCardsGenerated),
        suffix: resultKeySuffix,
        roundId,
      },
    };

    return this.roundsRepository.create({
      id: roundId,
      result: { communityCards: betTracks.communityCards },
      roundStartTime: new Date(),
      uid: player.UID,
      name: player.profile.name,
      odds,
      encryptedResult: encrypt(JSON.stringify(generatedResult)),
      md5,
      encryptedMD5: encrypt(md5Raw),
      exchangeRateId: this.gameData.exchangeRates.exId,
    });
  }

  createMD5Raw(generatedResult, roundId) {
    const cardString = [
      generatedResult.player.map(cardToString).join(' '),
      generatedResult.dealer.map(cardToString).join(' '),
      generatedResult.communityCardsGenerated.map(cardToString).join(' '),
    ].join(', ');

    return `{${cardString}}_{#${roundId}${generatedResult.suffix}}`;
  }

  async processHold(player) {
    const { betTracks } = this.gameData.ingame[player.profile.name];
    const generatedResult = betTracks.generatedResult;

    betTracks.player = generatedResult.player;
    betTracks.dealer = generatedResult.dealer;
    betTracks.isSwappedOrHold = true;
    betTracks.combinationResult.player = this.definition.settle(
      betTracks.player.concat(betTracks.communityCards),
    );

    await this.betsRepository.update(
      { roundId: betTracks.roundId },
      {
        holdTime: new Date(),
        cards: betTracks.player,
        result: betTracks.combinationResult.player,
      },
    );
    await this.roundsRepository.update(
      { id: betTracks.roundId },
      {
        isSwappedOrHold: true,
        result: { dealer: betTracks.dealer, communityCards: betTracks.communityCards },
      },
    );

    const hold = {
      roundId: betTracks.roundId,
      player: betTracks.player,
      combinationResult: betTracks.combinationResult,
      communityCards: betTracks.communityCards,
    };

    this.publisher.publishToUser(player.UID, { hold });
  }

  async processSwap(player) {
    const playerName = player.profile.name;
    const { betTracks } = this.gameData.ingame[playerName];
    const generatedResult = betTracks.generatedResult;

    betTracks.isSwappedOrHold = true;
    betTracks.player = generatedResult.dealer;
    betTracks.dealer = generatedResult.player;
    betTracks.combinationResult.player = this.definition.settle(
      betTracks.player.concat(betTracks.communityCards),
    );

    await this.betsRepository.update(
      { roundId: betTracks.roundId },
      {
        cards: betTracks.player,
        result: betTracks.combinationResult.player,
        swapTime: new Date(),
      },
    );

    await this.roundsRepository.update(
      { id: betTracks.roundId },
      {
        result: { dealer: betTracks.dealer, communityCards: betTracks.communityCards },
        isSwappedOrHold: true,
      },
    );

    const swap = {
      roundId: betTracks.roundId,
      player: betTracks.player,
      combinationResult: betTracks.combinationResult,
      communityCards: betTracks.communityCards,
    };

    this.publisher.publishToUser(player.UID, { swap });
  }

  async createBet(player) {
    const { betTracks } = this.gameData.ingame[player.profile.name];
    const combinationResult = this.definition.settle(
      betTracks.player.concat(betTracks.communityCards),
    );
    betTracks.combinationResult.player = { ...combinationResult };

    await this.betsRepository.create({
      uid: player.UID,
      name: player.profile.name,
      aa: betTracks.bets?.aa,
      ante: betTracks.bets?.ante,
      cards: [],
      bet: betTracks.bets?.aa + betTracks.bets?.ante,
      result: {},
      time: new Date(),
      playerId: player.session?.playerId,
      siteId: player.session?.siteId,
      currency: player.session?.currencyName,
      operatorId: player.session?.operatorId,
      rate: this.calculateCurrencyRate(player.session),
      roundId: betTracks.roundId,
    });
  }

  async processDoubleCall(player) {
    const { betTracks } = this.gameData.ingame[player.profile.name];
    betTracks.isDealing = true;

    const betInfo = {
      amount: betTracks.bets.ante * 2,
      gameId: this.definition.id,
      gameRoundId: betTracks.roundId,
      choiceId: this.definition.choicesMapper[gameSettings.actions.doubleCall],
    };
    const apiResult = await this.placeBet({ id: player.UID, session: player.session }, betInfo);
    const { response } = apiResult;
    if (apiResult.isOk) {
      await this.handleSuccessCall(player, betInfo.amount, response);
    } else {
      this.handleFailPlaceBetResponse(player, response, gameSettings.actions.doubleCall);
    }
    betTracks.isDealing = false;
  }

  async handleSuccessCall(player, amount, balance) {
    await this.updateBetTracksAfterCall(player, amount);

    if (player.profile.minBet !== balance.minBet || player.profile.maxBet !== balance.maxBet) {
      await this.updateUserStakeLevel(player, balance.minBet, balance.maxBet);
    }

    const { betTracks } = this.gameData.ingame[player.profile.name];
    await this.betsRepository.update(
      { roundId: betTracks.roundId },
      {
        $inc: { call: amount, bet: amount },
        result: betTracks.combinationResult.player,
        callTime: new Date(),
      },
    );

    const call = {
      communityCards: betTracks.communityCards,
      combinationResult: betTracks.combinationResult,
      dealer: betTracks.dealer,
      totalAmount: Object.values(betTracks.bets).reduce((total, item) => total + item),
      choices: betTracks.bets,
    };

    this.publisher.publishToUser(player.UID, { endBet: amount, user: balance, call });

    await this.settleGameRoundConsumer.settleRound(player.profile.name);
  }

  async updateBetTracksAfterCall(player, amount) {
    const { betTracks } = this.gameData.ingame[player.profile.name];

    betTracks.bets.call = amount;
    betTracks.communityCards = betTracks.communityCardsGenerated;

    const combinationPlayerResult = this.definition.settle(
      betTracks.player.concat(betTracks.communityCardsGenerated),
    );
    const combinationDealerResult = this.definition.settle(
      betTracks.dealer.concat(betTracks.communityCardsGenerated),
    );

    betTracks.combinationResult = {
      player: combinationPlayerResult,
      dealer: combinationDealerResult,
      isQualified: isQualified(combinationDealerResult),
    };
  }

  handleFailPlaceBetResponse(player, response, action) {
    const noticeMapping = {
      inSufficientBalance: helpers.noticeHelper.notEnoughMoney,
      cannotProcessBet: helpers.noticeHelper.placeBetNextRound,
      inSufficientScoin: helpers.noticeHelper.notEnoughScoin,
    };

    const notice = Object.keys(noticeMapping).reduce(
      (result, key) => (response[key] ? noticeMapping[key] : result),
      response,
    );

    this.handleFailedBet(player, notice, { betChoice: action });
  }
}
