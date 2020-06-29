import { Callback, Context, Handler } from 'aws-lambda';
import * as DynamoDB from 'aws-sdk/clients/dynamodb';
import * as StepFunctions from 'aws-sdk/clients/stepfunctions';
import https = require('https');

const sslAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  rejectUnauthorized: true,
});
// @ts-ignore
sslAgent.setMaxListeners(0);

export const fanout: Handler = async (
  event,
  context: Context,
  callback: Callback,
) => {
  const tableName = process.env.DYNAMODB_TABLE as string;
  const db = new DynamoDB.DocumentClient({ httpOptions: { agent: sslAgent } });

  const stateMachineArn = process.env.STEP_FUNCTION as string;
  const stepFunctions = new StepFunctions({ httpOptions: { agent: sslAgent } });

  const scanResult = await db.scan({ TableName: tableName }).promise();
  const items = scanResult.Items || [];

  const result = await Promise.all(
    items.map((data) =>
      stepFunctions
        .startExecution({ stateMachineArn, input: JSON.stringify(data) })
        .promise(),
    ),
  );

  callback(null, result);
};
