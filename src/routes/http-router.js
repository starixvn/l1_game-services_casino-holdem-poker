import TableHttpRouter from 'sc-game-base/src/table/routers/table-http-router';
import { logger } from 'sc-common';
import { isQualified } from '../helpers/result-helper';
import { gameNotifications } from 'sc-base-database';
import { utils } from 'sc-common';

export default class HttpRouter extends TableHttpRouter {
  constructor(
    appConfigs,
    gameData,
    historyQuery,
    userSessionsRepository,
    metricQuery,
    logService,
    definition,
    publisher,
  ) {
    super(appConfigs, gameData, historyQuery, userSessionsRepository, metricQuery, logService);

    this.definition = definition;
    this.publisher = publisher;
  }
  init(app) {
    super.init(app);

    app.post(
      '/api/set-result',
      utils.authentication.useAuthenticate({
        authUrl: this.appConfigs.apiSettings.authUrl,
        audiences: this.appConfigs.authenticateSettings.audiences,
      }),
      this.handleSetResult(),
    );
    app.post(
      '/api/void-ticket',
      utils.authentication.useAuthenticate({
        authUrl: this.appConfigs.apiSettings.authUrl,
        audiences: this.appConfigs.authenticateSettings.audiences,
      }),
      (_req, res) => this.handleVoidTicket(_req, res),
    );
  }

  handleSetResult() {
    return (req, res) => {
      if (this.appConfigs.sentry.env === 'PROD' || this.appConfigs.sentry.env === 'UAT') {
        res.sendStatus(404);
        return;
      }

      this.gameData.resultFromAdmin = req.body;
      const playerResult = this.definition.settle(req.body.player.concat(req.body.communityCards));

      const dealerResult = this.definition.settle(req.body.dealer.concat(req.body.communityCards));

      logger.logError(`Set result from api: ${JSON.stringify(this.gameData.resultFromAdmin)}`);

      res.send({ playerResult, dealerResult, isQualified: isQualified(dealerResult) });
    };
  }

  async handleVoidTicket(req, res) {
    try {
      const { Name, UserIdentify } = req?.body || {};
      if (!Name) {
        logger.logError('Player not found');
        res.send(false);
        return;
      }

      delete this.gameData.ingame[Name];
      await gameNotifications.deleteOne({ uid: UserIdentify, gameId: this.definition.id });
      logger.logError(`Void running ticket from api call for ${JSON.stringify(Name)}`);
      this.publisher.publishToUser(UserIdentify, { toLobby: true });
      res.send(true);
    } catch (error) {
      logger.logError(error);
      res.send(false);
    }
  }
}
