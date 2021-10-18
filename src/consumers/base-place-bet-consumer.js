import gameSettings from '../game-settings';
import { helpers } from "sc-common";

export default class BasePlaceBetConsumer {
  constructor(definition, gameData, publisher, logService) {
    this.definition = definition;
    this.gameData = gameData;
    this.publisher = publisher;
    this.logService = logService;
  }

  async composeActionValidationCriteria(player, payload) {
    return [];
  }

  async composeValidationCriteria(player, payload) {
    const bettingTimeValidationCriteria =
      (await this.composeBettingTimeValidationCriteria(player)) ?? [];
    const actionValidationCriteria =
      (await this.composeActionValidationCriteria(player, payload)) || [];

    return bettingTimeValidationCriteria.concat(actionValidationCriteria);
  }

  async composeBettingTimeValidationCriteria(player) {
    const configs = this.gameData.gameConfigs;

    return [
      {
        failure: !configs.enabled,
        notice: configs.disabled_message,
      }
    ];
  }

  async validateBetRequest(player, payload) {
    const criteria = await this.composeValidationCriteria(player, payload);
    const failedCriterion = criteria.find((criterion) => criterion.failure);

    if (failedCriterion) {
      this.publisher.publishToUser(player.UID, { endBet: -1, notice: failedCriterion.notice });
      return false;
    }

    return true;
  }

  async consume(player, payload, queuePayload) {
    const name = player.profile.name;

    try {
      if (!(await this.validateBetRequest(player, payload))) {
        return;
      }
    } catch (e) {
      this.logService.logError(e);
      this.publisher.publishToUser(player.UID, {
        endBet: -1,
        notice: this.getNoticeObj(helpers.noticeHelper.invalidBet),
      });
      return;
    }

    if (this.gameData.ingame[name]?.betQueue.length > 0) {
      this.publisher.publishToUser(player.UID, {
        endBet: -1,
        notice: this.getNoticeObj(helpers.noticeHelper.invalidBet),
      });

      return;
    }

    if (queuePayload.action === gameSettings.actions.deal && !this.gameData.ingame[name]) {
      const newPlayer = {
        name: player.profile.name,
        betTracks: {},
        betQueue: [],
      };

      this.gameData.ingame[name] = newPlayer;
    }

    this.gameData.ingame[name].betQueue.push({ player, payload: queuePayload });
  }

  getNoticeObj(errorCode, extraData) {
    return {
      errorCode,
      ...extraData,
    };
  }
}
