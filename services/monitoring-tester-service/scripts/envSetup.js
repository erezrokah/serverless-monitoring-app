const path = require('path');
const { readFile } = require('fs-extra');
const yaml = require('js-yaml');
const { updateE2eTestsConfig } = require('./utils');

const getStackName = async (serverlessYaml, stage) => {
  const content = await readFile(serverlessYaml);
  return `${yaml.safeLoad(content).service}-${stage}`;
};

const getStackOutputs = async (provider, stackName, stage, region) => {
  const result = await provider.request(
    'CloudFormation',
    'describeStacks',
    { StackName: stackName },
    stage,
    region,
  );
  const outputs = result.Stacks[0].Outputs.map(
    ({ OutputKey, OutputValue }) => ({ [OutputKey]: OutputValue }),
  );
  return outputs;
};

const setupE2eTestsConfig = async () => {
  // eslint-disable-next-line no-undef
  const provider = serverless.getProvider('aws');
  // eslint-disable-next-line no-undef
  const { stage, region } = options;

  console.log(`stage = ${stage}, region = ${region}`);

  const servicesDir = path.join(__dirname, '..', '..');
  const commonServiceStack = await getStackName(
    path.join(servicesDir, 'monitoring-common', 'serverless.yml'),
    stage,
  );

  const { MonitoringDataTableName } = await getStackOutputs(
    provider,
    commonServiceStack,
    stage,
    region,
  );

  await updateE2eTestsConfig({ MonitoringDataTableName });
};

setupE2eTestsConfig();
