import { Core, Table } from 'sc-game-base';
import appConfigs from './configs';
import gameSettings from './game-settings';
import { generateResult, getSettleResult } from './helpers/result-helper';
import ContainerRegistry from './container-registry';
import BaseGameStartup from '@nex3/nex3-game-base/core/base-game-startup';
import AuthenticationManager from '@nex3/nex3-game-base/helpers/authentication-helpers';
import UserClient from '@nex3/nex3-game-base/helpers/user-client-communicator';
import MarketManagement from '@nex3/market-management';

const run = async () => {
  const definition = new Core.GameDefinition(gameSettings, generateResult, getSettleResult);
  const gameData = new Table.TableGameData(gameSettings.durations.wholeRound);
  const container = new ContainerRegistry().register(appConfigs, definition, gameData);
  const startup = new BaseGameStartup(container);
  const app = new Core.BaseGameApp(container, startup);

  await app.run();

  await AuthenticationManager.init(appConfigs.mainServerApiSettings.auth);
  const userSiteId = appConfigs.mainServerApiSettings.auth.id;
  UserClient.initializeUserClientCommunicator(appConfigs.userSiteUrl, userSiteId);

  MarketManagement.init(appConfigs.marketConfigCacheTimeout);
};

run();
