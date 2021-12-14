export default class GetGameConfigsConsumer {
  constructor({ definition, gameData }) {
    this.definition = definition;
    this.gameData = gameData;
  }

  async consume(player) {
    const { md5, currencyGroupGames, gameConfigs } = this.gameData;
    const { odds, enableFreeBet } = gameConfigs;
    const { session } = player;
    const settings = currencyGroupGames.find((x) => x.groupId.toString() === session.currencyGroupId);

    player.socketClient.emit(this.definition.name, { gameConfigs: { ...settings, odds, enableFreeBet }, md5 });
  }
}
