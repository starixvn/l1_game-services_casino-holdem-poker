import TableHttpRouter from 'sc-game-base/src/table/routers/table-http-router';
import { logger } from 'sc-common';

export default class HttpRouter extends TableHttpRouter {
  init(app) {
    super.init(app);

    app.post('/set-result', this.handleSetResult());
  }

  handleSetResult() {
    return (req, res) => {
      if (this.appConfigs.env === 'PRO' || this.appConfigs.env === 'UAT') {
        res.sendStatus(404);
        return;
      }

      this.gameData.resultFromAdmin = req.body;
      logger.logError(`Set result from api: ${JSON.stringify(this.gameData.resultFromAdmin)}`);

      res.send({ success: true });
    };
  }
}
