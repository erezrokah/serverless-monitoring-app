import { Callback, Context, Handler } from 'aws-lambda';
import * as DynamoDB from 'aws-sdk/clients/dynamodb';
import * as StepFunctions from 'aws-sdk/clients/stepfunctions';

export const spanOut: Handler = async (
  event,
  context: Context,
  callback: Callback,
) => {
  const tableName = process.env.DYNAMODB_TABLE || '';
  const db = new DynamoDB.DocumentClient();

  const stateMachineArn = process.env.STEP_FUNCTION || '';
  const stepFunctions = new StepFunctions();

  const scanResult = await db.scan({ TableName: tableName }).promise();
  const items = scanResult.Items || [];

  const result = await Promise.all(
    items.map(data =>
      stepFunctions
        .startExecution({ stateMachineArn, input: JSON.stringify(data) })
        .promise(),
    ),
  );

  callback(null, result);
};
