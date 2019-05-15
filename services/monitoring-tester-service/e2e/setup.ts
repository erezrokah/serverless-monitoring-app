// import { deploy } from 'aws-testing-library/lib/utils/serverless';
import { IConfig } from './types';

const globalSetup = async () => {
  const { Stage: stage } = require('./config.json') as IConfig;
  // await deploy(stage);
  console.log('running e2e tests for stage', stage);
};

export default globalSetup;
