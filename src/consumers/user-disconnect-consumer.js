import { gameNotifications } from 'sc-base-database';
import { Core } from 'sc-game-base';

export default class UserDisconnectConsumer extends Core.BaseEventConsumers.UserDisconnectConsumer {
  constructor(definition, gameData) {
    super(gameData);
    this.definition = definition;
  }

  async consume(socketClient) {
    const realPlayer = this.gameData.realPlayers[socketClient.id];

    if (realPlayer) {
      delete this.gameData.players[realPlayer.UID];

      await this.updateRunningRound(realPlayer);
    }

    super.consume(socketClient);
  }

  async updateRunningRound(realPlayer) {
    const { betTracks } = this.gameData.ingame[realPlayer.profile.name] || { betTracks: {} };

    if (betTracks.roundId) {
      const gameInfo = {
        uid: realPlayer.UID,
        gameId: this.definition.id,
        gameInfo: { roundId: betTracks.roundId, roundStartTime: betTracks.roundStartTime },
      };

      await gameNotifications
        .updateOne(
          { uid: realPlayer.UID, gameId: this.definition.id },
          { $setOnInsert: gameInfo },
          { upsert: true, setDefaultsOnInsert: true },
        )
        .exec();
    }
  }
}
