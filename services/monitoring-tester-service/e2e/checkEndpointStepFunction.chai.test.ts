import awsTesting from 'aws-testing-library/lib/chai';
import chai = require('chai');

import * as StepFunctions from 'aws-sdk/clients/stepfunctions';
import { clearAllItems } from 'aws-testing-library/lib/utils/dynamoDb';
import {
  subscribeToTopic,
  unsubscribeFromTopic,
} from 'aws-testing-library/lib/utils/sqs';
import { stopRunningExecutions } from 'aws-testing-library/lib/utils/stepFunctions';
import { IConfig } from './types';

chai.use(awsTesting);

const { expect } = chai;

describe('checkEndpointStepFunction', () => {
  const {
    MonitoringDataTableName: table,
    CheckEndpointStepFunctionArn: stateMachineArn,
    NotificationsTopicArn: topicArn,
    Region: region,
  } = require('./config.json') as IConfig;

  let [subscriptionArn, queueUrl] = ['', ''];

  beforeEach(async () => {
    await stopRunningExecutions(region, stateMachineArn);
    await clearAllItems(region, table);

    ({ subscriptionArn, queueUrl } = await subscribeToTopic(region, topicArn));
  });

  afterEach(async () => {
    await stopRunningExecutions(region, stateMachineArn);
    await clearAllItems(region, table);

    await unsubscribeFromTopic(region, subscriptionArn, queueUrl);
  });

  test('should update dynamodb and send notification on bad endpoint', async () => {
    const stepFunctions = new StepFunctions({ region });

    const data = {
      id: 'fakePartyErrorTestId',
      logo: 'https://www.fakeParty.com/logo.png',
      name: 'Fake Party For Error Test',
      url: 'http://localhost',
    };
    await stepFunctions
      .startExecution({ stateMachineArn, input: JSON.stringify(data) })
      .promise();

    await expect({ region, stateMachineArn, timeout: 20000 }).to.have.state(
      'PersistResults',
    );
    await expect({ region, table }).to.have.item(
      { id: data.id },
      { ...data, status: 'ERROR', averageLatencyMs: -1 },
      false,
    );
    await expect({ region, stateMachineArn }).to.have.state('SendNotification');

    await expect({ region, queueUrl }).to.have.message(
      (message) =>
        message.Subject === 'Monitoring Service Notification' &&
        message.Message ===
          `The endpoint for service '${data.name}' is at 'ERROR' status, Please check!`,
    );
  });

  test('should update dynamodb and not send notification on good endpoint', async () => {
    const stepFunctions = new StepFunctions({ region });

    const data = {
      id: 'fakePartyPassTestId',
      logo: 'https://www.fakeParty.com/logo.png',
      name: 'Fake Party For Pass Test',
      url: 'https://www.google.com',
    };
    await stepFunctions
      .startExecution({ stateMachineArn, input: JSON.stringify(data) })
      .promise();

    await expect({ region, stateMachineArn }).to.have.state('PersistResults');
    await expect({ region, table }).to.has.item(
      { id: data.id },
      { ...data, status: 'PASS' },
      false,
    );
    await expect({ region, stateMachineArn }).to.have.state('SkipNotification');

    await expect({ region, queueUrl }).not.to.have.message(() => true);
  });
});
