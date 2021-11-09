export default class GetGameConfigsConsumer {
  constructor({ definition, gameData }) {
    this.definition = definition;
    this.gameData = gameData;
  }

  async consume(player) {
    const { gameConfigs, md5 } = this.gameData
    player.socketClient.emit(this.definition.name, { gameConfigs, md5 });
  }
}
