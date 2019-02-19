const path = require('path');
const fs = require('fs-extra');
const dotenv = require('dotenv');
const os = require('os');
const DynamoDB = require('aws-sdk/clients/dynamodb');

const handler = async (data, serverless) => {
  //this handler creates the environment for the frontend based on the services deployment output
  const { EndpointsTableName } = data;
  if (EndpointsTableName) {
    const region = serverless.variables.service.custom.currentRegion;
    const db = new DynamoDB.DocumentClient({ region });
    const items = require('./seed.json');

    console.log(`Seeding ${EndpointsTableName} with ${items.length} items`);

    const writeRequests = items.map(item => ({
      PutRequest: { Item: item },
    }));

    await db
      .batchWrite({ RequestItems: { [EndpointsTableName]: writeRequests } })
      .promise();
  }
};

module.exports = { handler };
