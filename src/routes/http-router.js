import TableHttpRouter from 'sc-game-base/src/table/routers/table-http-router';
import { logger } from 'sc-common';

export default class HttpRouter extends TableHttpRouter {
  constructor(appConfigs, gameData, historyQuery, userSessionsRepository, metricQuery, logService, definition) {
    super(
      appConfigs,
      gameData,
      historyQuery,
      userSessionsRepository,
      metricQuery,
      logService
    );

    this.definition = definition;
  }
  init(app) {
    super.init(app);

    app.post('/api/set-result', this.handleSetResult());
  }

  handleSetResult() {
    return (req, res) => {
      if (this.appConfigs.env === 'PRO' || this.appConfigs.env === 'UAT') {
        res.sendStatus(404);
        return;
      }

      this.gameData.resultFromAdmin = req.body;
      const playerResult = this.definition.settle(
        req.body.player.concat(req.body.communityCards),
      );

      const dealerResult = this.definition.settle(
        req.body.dealer.concat(req.body.communityCards),
      )
      logger.logWarning(`Set result from api: ${JSON.stringify(this.gameData.resultFromAdmin)}`);

      res.send({ playerResult, dealerResult });
    };
  }
}
