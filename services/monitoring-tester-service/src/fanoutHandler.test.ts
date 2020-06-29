import { fanout } from './fanoutHandler';

jest.mock('aws-sdk/clients/dynamodb', () => {
  const promise = jest.fn();
  const scan = jest.fn(() => ({ promise }));
  const DocumentClient = jest.fn(() => ({ scan }));
  const DynamoDB = { DocumentClient };
  return DynamoDB;
});

jest.mock('aws-sdk/clients/stepfunctions', () => {
  const promise = jest.fn();
  const startExecution = jest.fn(() => ({ promise }));
  const StepFunctions = jest.fn(() => ({ startExecution }));
  return StepFunctions;
});

describe('fanoutHandler', () => {
  const tableName = 'tableName';
  const stateMachineArn = 'stateMachineArn';
  beforeAll(() => {
    process.env.DYNAMODB_TABLE = tableName;
    process.env.STEP_FUNCTION = stateMachineArn;
  });
  test('should start step functions executions null items', async () => {
    const DynamoDB = require('aws-sdk/clients/dynamodb');
    const db = new DynamoDB.DocumentClient();
    const scanPromise = db.scan().promise;
    const scanResult = { Items: null };
    scanPromise.mockReturnValue(Promise.resolve(scanResult));

    const StepFunctions = require('aws-sdk/clients/stepfunctions');
    const stepFunctions = new StepFunctions();
    const startExecutionPromise = stepFunctions.startExecution().promise;
    const startExecutionResult = 'startExecutionResult';
    startExecutionPromise.mockReturnValue(
      Promise.resolve(startExecutionResult),
    );

    jest.clearAllMocks();

    const callback = jest.fn();
    await fanout({}, null as any, callback);

    expect.assertions(5);

    expect(db.scan).toHaveBeenCalledTimes(1);
    expect(db.scan).toHaveBeenCalledWith({ TableName: tableName });
    expect(stepFunctions.startExecution).toHaveBeenCalledTimes(0);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(null, []);
  });

  test('should start step functions executions with items', async () => {
    const DynamoDB = require('aws-sdk/clients/dynamodb');
    const db = new DynamoDB.DocumentClient();
    const scanPromise = db.scan().promise;
    const scanResult = { Items: ['item1', 'item2'] };
    scanPromise.mockReturnValue(Promise.resolve(scanResult));

    const StepFunctions = require('aws-sdk/clients/stepfunctions');
    const stepFunctions = new StepFunctions();
    const startExecutionPromise = stepFunctions.startExecution().promise;
    const startExecutionResult = 'startExecutionResult';
    startExecutionPromise.mockReturnValue(
      Promise.resolve(startExecutionResult),
    );

    jest.clearAllMocks();

    const callback = jest.fn();
    await fanout({}, null as any, callback);

    expect.assertions(5 + scanResult.Items.length);

    expect(db.scan).toHaveBeenCalledTimes(1);
    expect(db.scan).toHaveBeenCalledWith({ TableName: tableName });
    expect(stepFunctions.startExecution).toHaveBeenCalledTimes(
      scanResult.Items.length,
    );
    scanResult.Items.forEach((data) => {
      expect(stepFunctions.startExecution).toHaveBeenCalledWith({
        input: JSON.stringify(data),
        stateMachineArn,
      });
    });
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(
      null,
      new Array(scanResult.Items.length).fill(startExecutionResult),
    );
  });
});
