import BaseGameStartup from '@nex3/nex3-game-base/core/base-game-startup';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { init as initApis } from 'sc-base-apis';
import { init as initBaseDatabase } from 'sc-base-database';
import { logger } from 'sc-common';

import { authenticationHelpers } from 'sc-game-base/src/core/helpers';

export default class GameStartup extends BaseGameStartup {
  async configureServices(app) {
    const corsOptions = {
      origin: (origin, callback) => {
        if (
          this.appConfigs.corsUrls.includes(origin) ||
          !origin ||
          (this.appConfigs.env !== 'PRO' && this.appConfigs.env !== 'UAT')
        ) {
          callback(null, true);
        } else {
          callback(new Error(`Not allowed by CORS ${origin}`));
        }
      },
    };

    app.use(cors(corsOptions));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(morgan('combined'));
    app.use(helmet());

    if (this.appConfigs.enabledLogs) {
      logger.start(this.appConfigs.sentry);
    }

    await initBaseDatabase(this.appConfigs.database);
    await authenticationHelpers.init(this.appConfigs.mainServerApiSettings);
    await initApis(this.appConfigs.apiSettings);
  }
}
