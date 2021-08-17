import { ProcessBetQueue as BaseProcessBetQueue } from '@nex3/nex3-game-base/crons';
import { deal, generateDecks, reGenerateDecks } from '../helpers/deck-helper';
import { isQualified } from '../helpers/result-helper';
import gameSettings from '../game-settings';
import Translation from '@nex3/translation';
import { helpers } from 'sc-common';

export default class ProcessBetQueue extends BaseProcessBetQueue {
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
        case gameSettings.actions.call:
          await this.processCall(player);
          break;
        case gameSettings.actions.doubleCall:
          await this.processDoubleCall(player);
          break;
        case gameSettings.actions.fold:
          await this.settleGameRoundConsumer.settleRound(player.profile.name, true);
          break;
      }
    } catch (e) {
      this.logService.logError(e);
    }
  }

  buildPresetCards(resultFromAdmin) {
    const player = resultFromAdmin.player || [];
    const dealer = resultFromAdmin.dealer || [];
    const communityCards = resultFromAdmin.communityCards || [];
    const unusedCards = reGenerateDecks(player.concat(dealer, communityCards));
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

    this.gameData.roundId++;
    const roundId = this.gameData.roundId;

    const betInfo = {
      amount: payload.aa + payload.ante,
      gameId: this.definition.id,
      gameRoundId: roundId,
      choiceId: this.definition.choicesMapper[gameSettings.actions.deal],
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
    const presetCards = this.getPresetCards(player);
    const { betTracks } = this.gameData.ingame[player.profile.name];
    betTracks.deck = generateDecks(presetCards);
    deal(betTracks);

    const newRound = await this.createRound(player, roundId);
    betTracks.roundId = newRound.id;
    betTracks.roundStartTime = new Date();
    await this.createBet(player);

    this.publisher.publishToUser(player.UID, {
      deal: {
        roundId: betTracks.roundId,
        player: betTracks.player,
        communityCards: betTracks.communityCards,
        combinationResult: betTracks.combinationResult,
        totalAmount: Object.values(betTracks.bets).reduce((total, item) => total + item),
        choices: betTracks.bets,
      },
      endBet: betTracks.bets.ante + betTracks.bets.aa,
      user: balance,
    });
  }

  async createRound(player, roundId) {
    const { betTracks } = this.gameData.ingame[player.profile.name];
    const { odds } = this.gameData.gameConfigs;
    return this.roundsRepository.create({
      id: roundId,
      result: { dealer: betTracks.dealer, communityCards: betTracks.communityCards },
      roundStartTime: new Date(),
      uid: player.UID,
      name: player.profile.name,
      odds,
    });
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
      phien: betTracks.roundId,
      aa: betTracks.bets?.aa,
      ante: betTracks.bets?.ante,
      cards: betTracks.player,
      bet: betTracks.bets?.aa + betTracks.bets?.ante,
      result: combinationResult,
      time: new Date(),
      memberId: player.session?.memberId,
      siteId: player.session?.siteId,
    });
  }

  async processCall(player) {
    const { betTracks } = this.gameData.ingame[player.profile.name];

    const betInfo = {
      amount: betTracks.bets.ante,
      gameId: this.definition.id,
      gameRoundId: betTracks.roundId,
      choiceId: this.definition.choicesMapper[gameSettings.actions.call],
    };
    const apiResult = await this.placeBet({ id: player.UID, session: player.session }, betInfo);
    const { response } = apiResult;
    if (apiResult.isOk) {
      await this.handleSuccessCall(player, betInfo.amount, response);
    } else {
      this.handleFailPlaceBetResponse(player, response, gameSettings.actions.call);
    }
  }

  async processDoubleCall(player) {
    const { betTracks } = this.gameData.ingame[player.profile.name];

    const betInfo = {
      amount: betTracks.bets.ante * 2,
      gameId: this.definition.id,
      gameRoundId: betTracks.roundId,
      choiceId: this.definition.choicesMapper[gameSettings.actions.call],
    };
    const apiResult = await this.placeBet(
      { id: player.UID, session: player.session },
      betInfo,
      this.gameData,
    );
    const { response } = apiResult;
    if (apiResult.isOk) {
      await this.handleSuccessCall(player, betInfo.amount, response);
    } else {
      this.handleFailPlaceBetResponse(player, response, gameSettings.actions.doubleCall);
    }
  }

  async handleSuccessCall(player, amount, balance) {
    this.updateBetTracksAfterCall(player, amount);
    const { betTracks } = this.gameData.ingame[player.profile.name];

    await this.betsRepository.update(
      { phien: betTracks.roundId },
      { $inc: { call: amount, bet: amount }, result: betTracks.combinationResult.player },
    );

    const call = {
      communityCards: betTracks.communityCards,
      combinationResult: betTracks.combinationResult,
      dealer: betTracks.dealer,
      totalAmount: Object.values(betTracks.bets).reduce((total, item) => total + item),
    };

    this.publisher.publishToUser(player.UID, { endBet: amount, user: balance, call });

    await this.settleGameRoundConsumer.settleRound(player.profile.name);
  }

  updateBetTracksAfterCall(player, amount) {
    const { betTracks } = this.gameData.ingame[player.profile.name];
    const result = this.definition.generateResult(
      betTracks.communityCards,
      betTracks.dealer,
      betTracks.deck,
    );

    betTracks.communityCards.push(betTracks.deck.shift(), betTracks.deck.shift());
    betTracks.bets.call = amount;
    betTracks.dealer = result.dealer;
    betTracks.communityCards = result.communityCards;
    const combinationPlayerResult = this.definition.settle(
      betTracks.player.concat(betTracks.communityCards),
    );
    const combinationDealerResult = this.definition.settle(
      betTracks.dealer.concat(betTracks.communityCards),
    );
    betTracks.combinationResult = {
      player: combinationPlayerResult,
      dealer: combinationDealerResult,
      isQualified: isQualified(combinationDealerResult),
    };
  }

  handleFailPlaceBetResponse(player, response, action) {
    const translation = Translation.getInstance(player?.session?.language);
    const insufficientNotice = translation.t(translation.keys.notEnoughMoney);
    const cannotProcessBetNotice = translation.t(translation.keys.cannotProcessBet);
    const noticeMapping = {
      inSufficientBalance: insufficientNotice,
      cannotProcessBet: cannotProcessBetNotice,
      inSufficientScoin: helpers.noticeHelper.notEnoughScoin,
    };

    const notice = Object.keys(noticeMapping).reduce(
      (result, key) => (response[key] ? noticeMapping[key] : result),
      response,
    );

    this.handleFailedBet(player, notice, { betChoice: action });
  }
}
