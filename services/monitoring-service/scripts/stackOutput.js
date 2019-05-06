const path = require('path');
const fs = require('fs-extra');
const dotenv = require('dotenv');
const os = require('os');
const DynamoDB = require('aws-sdk/clients/dynamodb');
const { writeItems } = require('aws-testing-library/lib/utils/dynamoDb');

const replaceInEnvFile = async (file, envs) => {
  const keys = Object.keys(envs);
  if (keys.length <= 0) {
    return;
  }

  const envFile = path.join(__dirname, '..', '..', '..', 'frontend', file);
  await fs.ensureFile(envFile);
  const content = await fs.readFile(envFile);
  const envConfig = await dotenv.parse(content);

  keys.forEach(key => {
    envConfig[key] = envs[key];
  });

  await fs.remove(envFile);
  await Promise.all(
    Object.keys(envConfig).map(key =>
      fs.appendFile(envFile, `${key}=${envConfig[key]}${os.EOL}`),
    ),
  );
};

const handler = async (data, serverless) => {
  //this handler creates the environment for the frontend based on the services deployment output
  const {
    EndpointsTableName,
    ServiceEndpoint,
    UserPoolId,
    MonitoringDataTableName,
    CheckEndpointStepFunctionArn,
    NotificationsTopicArn,
  } = data;
  if (EndpointsTableName) {
    const region = serverless.variables.service.custom.currentRegion;
    const db = new DynamoDB.DocumentClient({ region });
    const items = require('./seed.json');

    console.log(`Seeding ${EndpointsTableName} with ${items.length} items`);

    await writeItems(region, EndpointsTableName, items);
  }

  if (ServiceEndpoint) {
    await replaceInEnvFile('.env.local', {
      REACT_APP_REST_API: ServiceEndpoint,
    });
  }

  if (UserPoolId) {
    const region = serverless.variables.service.custom.currentRegion;
    await replaceInEnvFile('.env.local', {
      REACT_APP_USER_POOL_ID: UserPoolId,
      REACT_APP_COGNITO_REGION: region,
    });
  }

  if (
    MonitoringDataTableName &&
    CheckEndpointStepFunctionArn &&
    NotificationsTopicArn
  ) {
    await fs.writeJSON(
      path.join(__dirname, '..', 'e2e', 'config.json'),
      {
        MonitoringDataTableName,
        CheckEndpointStepFunctionArn,
        NotificationsTopicArn,
        Region: serverless.variables.service.custom.currentRegion,
        Stage: serverless.service.provider.stage,
      },
      { spaces: 2 },
    );
  }
};

module.exports = { handler };
