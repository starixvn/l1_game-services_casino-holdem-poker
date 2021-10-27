import { BaseSocketRouter } from "sc-game-base/src/core/routers";

export default class SocketRouter extends BaseSocketRouter {
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
    userDealConsumer = null,
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
    });

    this.userDealConsumer = userDealConsumer;
    this.userDoubleCallConsumer = userDoubleCallConsumer;
    this.userFoldConsumer = userFoldConsumer;
  }

  init(socketClient) {
    super.init(socketClient);

    this.socketClient.on('getTicketDetail', this.handleGetTicketDetail.bind(this));
  }

  async handlePlaceBet(payload) {
    try {
      if (!this.verify()) {
        return;
      }

      if (payload.deal) {
        await this.userDealConsumer.consume(
          this.gameData.realPlayers[this.socketClient.id],
          payload.deal,
        );
        return;
      }

      if (payload.fold) {
        await this.userFoldConsumer.consume(this.gameData.realPlayers[this.socketClient.id], payload);
        return;
      }

      if (payload.doubleCall) {
        await this.userDoubleCallConsumer.consume(
          this.gameData.realPlayers[this.socketClient.id],
          payload,
        );
        return;
      }
    } catch (error) {
      this.logService.logError(error);
    }
  }

  async handleGetTicketDetail(payload) {
    try {
      if (!this.verify()) {
        return;
      }

      const ticketDetail = await this.historyQuery.queryTicketDetail(
        this.gameData.realPlayers[this.socketClient.id],
        payload.roundId,
      );

      this.socketClient.emit(this.definition.name, ticketDetail);
    } catch (error) {
      this.logService.logError(error);
    }
  }
}
