export default class GetGameConfigsConsumer {
  constructor({ definition, gameData, roundResultConsumer }) {
    this.definition = definition;
    this.gameData = gameData;
    this.roundResultConsumer = roundResultConsumer;
  }

  async consume(player) {
    player.socketClient.emit(this.definition.name, { gameConfigs: this.gameData.gameConfigs });
    // this.roundResultConsumer.generateResult(player.profile.name);
  }
}
