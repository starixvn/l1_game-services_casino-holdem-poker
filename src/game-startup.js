import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { init as initApis } from 'sc-base-apis';
import { init as initBaseDatabase } from 'sc-base-database';
import { logger } from 'sc-common';
import { Core } from 'sc-game-base';
import { authenticationHelpers } from 'sc-game-base/src/core/helpers';

export default class GameStartup extends Core.BaseStartup {
  constructor(container) {
    super(container);
    this.logger = logger;
  }

  async start() {
    try {
      const gameConfigsRepository = this.container.resolve(this.dependencies.gameConfigsRepository);

      this.gameData.gameConfigs = await gameConfigsRepository
        .findOne({ name: this.definition.configName })
        .lean()
        .exec();

      if (this.appConfigs.enableCron) {
        await this.gameCron.start();
      }

      this.processBetQueue.start();
    } catch (error) {
      this.logger.logError(error);
    }
  }

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
