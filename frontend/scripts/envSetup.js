const path = require('path');
const { readFile } = require('fs-extra');
const yaml = require('js-yaml');
const { replaceInEnvFile } = require('./utils');

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

  const outputsArray = result.Stacks[0].Outputs;

  let outputs = {};
  for (let i = 0; i < outputsArray.length; i++) {
    outputs[outputsArray[i].OutputKey] = outputsArray[i].OutputValue;
  }

  return outputs;
};

const setupFrontendEnvFile = async () => {
  // eslint-disable-next-line no-undef
  const provider = serverless.getProvider('aws');
  // eslint-disable-next-line no-undef
  const { stage, region } = options;

  console.log(`stage = ${stage}, region = ${region}`);

  const servicesDir = path.join(__dirname, '..', '..', 'services');
  const [
    appSyncServiceStack,
    commonServiceStack,
    endpointsTesterStack,
  ] = await Promise.all([
    getStackName(
      path.join(servicesDir, 'monitoring-appsync-service', 'serverless.yml'),
      stage,
    ),
    getStackName(
      path.join(servicesDir, 'monitoring-common', 'serverless.yml'),
      stage,
    ),
    getStackName(
      path.join(servicesDir, 'monitoring-appsync-service', 'serverless.yml'),
      stage,
    ),
  ]);

  const [
    { GraphQLApiUrl },
    { UserPoolId },
    { ServiceEndpoint },
  ] = await Promise.all([
    getStackOutputs(provider, appSyncServiceStack, stage, region),
    getStackOutputs(provider, commonServiceStack, stage, region),
    getStackOutputs(provider, endpointsTesterStack, stage, region),
  ]);

  await replaceInEnvFile({
    REACT_APP_COGNITO_REGION: region,
    REACT_APP_APPSYNC_REGION: region,
    REACT_APP_USER_POOL_ID: UserPoolId,
    REACT_APP_GRAPHQL_API_URL: GraphQLApiUrl,
    REACT_APP_REST_API: ServiceEndpoint,
  });
};

setupFrontendEnvFile();
