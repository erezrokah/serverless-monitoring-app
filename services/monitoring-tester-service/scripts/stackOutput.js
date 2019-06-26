const { writeItems } = require('aws-testing-library/lib/utils/dynamoDb');
const { updateE2eTestsConfig } = require('./utils');

const handler = async (data, serverless) => {
  //this handler creates the environment for the frontend based on the services deployment output
  const {
    EndpointsTableName,
    CheckEndpointStepFunctionArn,
    NotificationsTopicArn,
  } = data;

  const region = serverless.variables.service.custom.currentRegion;
  const items = require('./seed.json');

  console.log(`Seeding ${EndpointsTableName} with ${items.length} items`);

  await writeItems(region, EndpointsTableName, items);

  const e2eConfig = {
    CheckEndpointStepFunctionArn,
    NotificationsTopicArn,
    Region: serverless.variables.service.custom.currentRegion,
    Stage: serverless.service.provider.stage,
  };

  await updateE2eTestsConfig(e2eConfig);
};

module.exports = { handler };
