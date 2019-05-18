import React from 'react';
import renderer from 'react-test-renderer';
import { render, waitForElement } from 'react-testing-library';
import { listEvents } from '../graphql/queries';
import { onUpdateDataEntry } from '../graphql/subscriptions';
import { DataEntry } from '../graphql/types';

jest.mock('aws-amplify', () => {
  const graphqlOperation = jest.fn(args => args);

  const subscription = { unsubscribe: jest.fn() };
  const graphqlResult = { subscribe: jest.fn(() => subscription), data: {} };
  return {
    API: {
      graphql: jest.fn(() => graphqlResult),
    },
    __esModule: true,
    default: { configure: jest.fn() },
    graphqlOperation,
  };
});

import DataTable, { fetchListEffectCallback, reducer } from './DataTable';

describe('DataTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    const { getByText } = render(<DataTable />);
    expect(getByText('Party Name')).toBeInTheDocument();
  });

  test('matches snapshot', () => {
    const tree = renderer.create(<DataTable />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('updates data from graphql query', async () => {
    const { API, graphqlOperation } = require('aws-amplify');

    const entries: DataEntry[] = [
      {
        averageLatencyMs: -1,
        id: 'id1',
        lastSample: new Date('1947/1/1').toISOString(),
        logo: 'logo1',
        name: 'name1',
        status: 'ERROR',
        url: 'url1',
      },
      {
        averageLatencyMs: 3000,
        id: 'id2',
        lastSample: new Date('1948/1/1').toISOString(),
        logo: 'logo2',
        name: 'name2',
        status: 'WARNING',
        url: 'url2',
      },
      {
        averageLatencyMs: 1000,
        id: 'id3',
        lastSample: new Date('1949/1/1').toISOString(),
        logo: 'logo3',
        name: 'name3',
        status: 'PASS',
        url: 'url3',
      },
      {
        averageLatencyMs: 4000,
        id: 'id4',
        lastSample: new Date('1950/1/1').toISOString(),
        logo: 'logo4',
        name: 'name4',
        status: 'Unknown',
        url: 'url4',
      },
    ];

    const graphqlQueryResult = { data: { getDataEntries: { items: entries } } };

    const subscription = { unsubscribe: jest.fn() };
    const graphqlSubscriptionResult = {
      subscribe: jest.fn(() => subscription),
    };

    API.graphql.mockImplementation((args: any) => {
      if (args === listEvents) {
        return graphqlQueryResult;
      }
      if (args === onUpdateDataEntry) {
        return graphqlSubscriptionResult;
      }
      return null;
    });

    const { container, getByTestId, unmount } = render(<DataTable />);

    await waitForElement(() => getByTestId(entries[0].id));

    expect(API.graphql).toHaveBeenCalledTimes(2);
    expect(API.graphql).toHaveBeenCalledWith(listEvents);
    expect(API.graphql).toHaveBeenCalledWith(onUpdateDataEntry);

    expect(graphqlOperation).toHaveBeenCalledTimes(2);
    expect(graphqlOperation).toHaveBeenCalledWith(listEvents);
    expect(graphqlOperation).toHaveBeenCalledWith(onUpdateDataEntry);

    expect(graphqlSubscriptionResult.subscribe).toHaveBeenCalledTimes(1);
    expect(graphqlSubscriptionResult.subscribe).toHaveBeenCalledWith({
      next: expect.any(Function),
    });

    expect(container.firstChild).toMatchSnapshot();

    unmount();
    expect(subscription.unsubscribe).toHaveBeenCalledTimes(1);
    expect(subscription.unsubscribe).toHaveBeenCalledWith();
  });

  test('updates data from graphql subscription', async () => {
    const { API } = require('aws-amplify');

    const entries: DataEntry[] = [
      {
        averageLatencyMs: -1,
        id: 'id1',
        lastSample: new Date('1947/1/1').toISOString(),
        logo: 'logo1',
        name: 'name1',
        status: 'ERROR',
        url: 'url1',
      },
    ];

    const graphqlQueryResult = { data: { getDataEntries: { items: entries } } };

    const subscription = { unsubscribe: jest.fn() };
    const graphqlSubscriptionResult = {
      subscribe: jest.fn(() => subscription),
    };

    API.graphql.mockImplementation((args: any) => {
      if (args === listEvents) {
        return graphqlQueryResult;
      }
      if (args === onUpdateDataEntry) {
        return graphqlSubscriptionResult;
      }
      return null;
    });

    const { container, getByTestId } = render(<DataTable />);

    await waitForElement(() => getByTestId(entries[0].id));

    expect(graphqlSubscriptionResult.subscribe).toHaveBeenCalledTimes(1);
    expect(graphqlSubscriptionResult.subscribe).toHaveBeenCalledWith({
      next: expect.any(Function),
    });

    const newEntry = {
      averageLatencyMs: 3000,
      id: 'id2',
      lastSample: new Date('1948/1/1').toISOString(),
      logo: 'logo2',
      name: 'name2',
      status: 'WARNING',
      url: 'url2',
    };

    const existingEntry = {
      ...entries[0],
      averageLatencyMs: 1000,
    };

    const firstCall = graphqlSubscriptionResult.subscribe.mock
      .calls[0] as any[];
    const subscribeArguments = firstCall[0];

    subscribeArguments.next({
      value: { data: { updateDataEntry: existingEntry } },
    });
    subscribeArguments.next({ value: { data: { updateDataEntry: newEntry } } });
    subscribeArguments.next({ value: { data: {} } });

    await waitForElement(() => getByTestId(newEntry.id));

    expect(container.firstChild).toMatchSnapshot();

    const existingElement = await getByTestId(existingEntry.id);
    expect(
      (existingElement.getElementsByClassName('value').item(0) as Element)
        .innerHTML,
    ).toEqual(existingEntry.averageLatencyMs.toFixed(2));
  });

  test('handles graphql query errors', async () => {
    const { API } = require('aws-amplify');

    const errors = [{ message: 'Unauthorized' }];

    const subscription = { unsubscribe: jest.fn() };
    const graphqlSubscriptionResult = {
      subscribe: jest.fn(() => subscription),
    };

    API.graphql.mockImplementation((args: any) => {
      if (args === listEvents) {
        return Promise.reject({ errors });
      }
      if (args === onUpdateDataEntry) {
        return graphqlSubscriptionResult;
      }
      return null;
    });

    const { container, getByTestId } = render(<DataTable />);

    await waitForElement(() => getByTestId('error-messages'));

    expect(graphqlSubscriptionResult.subscribe).toHaveBeenCalledTimes(1);
    expect(graphqlSubscriptionResult.subscribe).toHaveBeenCalledWith({
      next: expect.any(Function),
    });

    expect(container.firstChild).toMatchSnapshot();
  });

  test('fetchListEffectCallback dispatches when subscribed', async () => {
    const fetchData = jest.fn();
    const dispatch = jest.fn();

    let resolver = () => {
      return;
    };
    const promise = new Promise(resolve => {
      resolver = resolve;
    });
    fetchData.mockImplementation(() => {
      resolver();
      return Promise.resolve({ items: [] });
    });

    fetchListEffectCallback(fetchData, dispatch);

    await promise;

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch.mock.calls[0][0]).toEqual({
      payload: [],
      type: 'setAllEntries',
    });
    expect(dispatch.mock.calls[1][0]).toEqual({
      payload: false,
      type: 'setLoading',
    });
  });

  test("fetchListEffectCallback doesn't dispatch when unsubscribed", async () => {
    const fetchData = jest.fn();
    const dispatch = jest.fn();

    let resolver = () => {
      return;
    };
    const promise = new Promise(resolve => {
      resolver = resolve;
    });
    fetchData.mockImplementation(() => {
      resolver();
      return Promise.resolve();
    });

    const unsubscribe = fetchListEffectCallback(fetchData, dispatch);
    unsubscribe();

    await promise;

    expect(dispatch).toHaveBeenCalledTimes(0);
  });

  test('reducer default path', () => {
    const currentState = {} as any;
    expect(reducer(currentState, { type: 'fakeAction', payload: '' })).toBe(
      currentState,
    );
  });
});
