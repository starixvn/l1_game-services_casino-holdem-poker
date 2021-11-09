import mongoose from "mongoose";
import { GameData } from "../game-data";
// import { sumArrayNumber } from "../helpers/array-helper";
import { createHashMD5, randomString } from "../helpers/crypto-helper";
import { RoundResultPublisher } from "../publishers";
import { deal, generateDecks, reGenerateDecks } from '../helpers/deck-helper';

export default class RoundResultConsumer {
    constructor(gameData, definition, roundsRepository, roundResultPublisher) {
        this.gameData = gameData;
        this.definition = definition;

        this.roundsRepository = roundsRepository;
        this.roundResultPublisher = roundResultPublisher;
    }

    async generateResult(playerName) {
        // const presetCards = this.getPresetCards(player);
        // const { betTracks } = this.gameData.ingame[player.profile.name];
        // betTracks.deck = generateDecks(presetCards);
        // deal(betTracks);
        
        const { betTracks } = this.gameData.ingame[playerName];
        const settlementResult = betTracks.combinationResult.dealer;
    
        // TODO
        const resultKey = `[${playerName};${JSON.stringify(settlementResult)}]${randomString()}`;
        const md5 = createHashMD5(resultKey);
        this.gameData.currentMD5 = md5;
        this.gameData.resultKey = resultKey;
    
        const round = await this.roundsRepository
          .findOneAndUpdate(
            { id: betTracks.roundId },
            { md5, resultKey },
          )
          .lean()
          .exec();
    
        this.roundResultPublisher.publishMD5(md5);
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
}
