jest.mock('@aws-amplify/api', () => {
  return {
    __esModule: true,
    default: { graphql: jest.fn() },
  };
});

jest.mock('@aws-amplify/core', () => {
  const actual = jest.requireActual('@aws-amplify/core');
  return {
    __esModule: true,
    ...actual,
    default: { ...actual, register: jest.fn(), configure: jest.fn() },
  };
});

const GRAPHQL_ENDPOINT_URL = 'GRAPHQL_ENDPOINT_URL';
const AWS_REGION = 'stateMachinAWS_REGIONeArn';

process.env.GRAPHQL_ENDPOINT_URL = GRAPHQL_ENDPOINT_URL;
process.env.AWS_REGION = AWS_REGION;

import API from '@aws-amplify/api';
import Amplify from '@aws-amplify/core';
import { persistResults, updateDataEntry } from './persistResultsHandler';

jest.spyOn(console, 'log');
jest.spyOn(console, 'error');

describe('persistResultsHandler', () => {
  const event = {
    averageLatencyMs: 100,
    id: 'id',
    lastSample: new Date().toISOString(),
    logo: 'logo',
    name: 'name',
    status: 'status',
    url: 'url',
  };

  const configure = Amplify.configure as jest.Mock;
  const graphql = API.graphql as jest.Mock;

  beforeEach(() => {
    graphql.mockClear();
  });

  test('should run mutation query on event', async () => {
    const callback = jest.fn();
    await persistResults(event, null as any, callback);

    expect.assertions(8);

    expect(configure).toHaveBeenCalledTimes(1);
    expect(configure).toHaveBeenCalledWith({
      aws_appsync_authenticationType: 'AWS_IAM',
      aws_appsync_graphqlEndpoint: GRAPHQL_ENDPOINT_URL,
      aws_appsync_region: AWS_REGION,
    });

    expect(graphql).toHaveBeenCalledTimes(1);
    expect(graphql).toHaveBeenCalledWith({
      authMode: 'AWS_IAM',
      query: updateDataEntry,
      variables: {
        input: event,
      },
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(null, event);

    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith(
      'persisting results with input:',
      event,
    );
  });

  test('should log error on graphql error', async () => {
    const error = new Error('Unauthorized');
    const callback = jest.fn();

    (API.graphql as jest.Mock).mockReturnValue(Promise.reject(error));

    await persistResults(event, null as any, callback);

    expect(graphql).toHaveBeenCalledTimes(1);
    expect(graphql).toHaveBeenCalledWith({
      authMode: 'AWS_IAM',
      query: updateDataEntry,
      variables: {
        input: event,
      },
    });

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(error);
  });
});
