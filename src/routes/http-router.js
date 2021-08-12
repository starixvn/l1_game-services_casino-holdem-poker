import TableHttpRouter from 'sc-game-base/src/table/routers/table-http-router';
import { logger } from 'sc-common';

export default class HttpRouter extends TableHttpRouter {
  init(app, appConfigs) {
    super.init(app, appConfigs);

    app.post('/set-result', this.handleSetResult(appConfigs));
  }

  handleSetResult(appConfig) {
    return (req, res) => {
      if (appConfig.env === 'PRO' || appConfig.env === 'UAT') {
        res.sendStatus(404);
        return;
      }

      this.gameData.resultFromAdmin = req.body;
      logger.logError(`Set result from api: ${JSON.stringify(this.gameData.resultFromAdmin)}`);

      res.send({ success: true });
    };
  }
}
