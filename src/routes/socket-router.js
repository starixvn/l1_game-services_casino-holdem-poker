import { TableSocketRouter } from '@nex3/nex3-game-base/routes';

export default class SocketRouter extends TableSocketRouter {
  constructor({
    definition,
    gameData,
    userSignInConsumer,
    inGameConsumer,
    placeBetConsumer,
    userDisconnectConsumer,
    userSignInPublisher,
    historyQuery,
    logService,
    changeLanguageConsumer,
    getGameConfigsConsumer,
    userDealConsumer = null,
    userCallConsumer = null,
    userDoubleCallConsumer = null,
    userFoldConsumer = null,
  }) {
    super({
      definition,
      gameData,
      userSignInConsumer,
      inGameConsumer,
      placeBetConsumer,
      userDisconnectConsumer,
      userSignInPublisher,
      historyQuery,
      logService,
      changeLanguageConsumer,
      getGameConfigsConsumer,
    });

    this.userDealConsumer = userDealConsumer;
    this.userCallConsumer = userCallConsumer;
    this.userDoubleCallConsumer = userDoubleCallConsumer;
    this.userFoldConsumer = userFoldConsumer;
  }

  handlePlaceBet(payload) {
    try {
      if (!this.verify()) {
        return;
      }

      if (payload.deal) {
        this.userDealConsumer.consume(
          this.gameData.realPlayers[this.socketClient.id],
          payload.deal,
        );
        return;
      }

      if (payload.fold) {
        this.userFoldConsumer.consume(this.gameData.realPlayers[this.socketClient.id], payload);
        return;
      }

      if (payload.call) {
        this.userCallConsumer.consume(this.gameData.realPlayers[this.socketClient.id], payload);
        return;
      }

      if (payload.doubleCall) {
        this.userDoubleCallConsumer.consume(
          this.gameData.realPlayers[this.socketClient.id],
          payload,
        );
        return;
      }
    } catch (error) {
      this.logService.logError(error);
    }
  }
}
