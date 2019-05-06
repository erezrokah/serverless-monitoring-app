import { deploy } from 'aws-testing-library/lib/utils/serverless';
import { IConfig } from './types';

const deployDev = async () => {
  const { Stage: stage } = require('./config.json') as IConfig;
  await deploy(stage);
};

export default deployDev;
