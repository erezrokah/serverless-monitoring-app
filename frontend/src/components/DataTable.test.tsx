import React from 'react';
import renderer from 'react-test-renderer';
import { render, waitForElement } from 'react-testing-library';
import { ListEvents } from '../queries';
import DataTable, { IEntry } from './DataTable';

jest.mock('aws-amplify');
jest.useFakeTimers();

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

  test('updates data from graphql api', async () => {
    const { API, graphqlOperation } = require('aws-amplify');

    const entries: IEntry[] = [
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
    const results = { data: { getDataEntries: { items: entries } } };
    API.graphql.mockReturnValue(results);

    const operation = {};
    graphqlOperation.mockReturnValue(operation);

    const { container, getByTestId } = render(<DataTable />);

    expect(setInterval).toHaveBeenCalledTimes(1);
    expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 1000);

    jest.advanceTimersByTime(1500);

    jest.useRealTimers();

    await waitForElement(() => getByTestId(entries[0].id));

    expect(API.graphql).toHaveBeenCalledTimes(1);
    expect(API.graphql).toHaveBeenCalledWith(operation);

    expect(graphqlOperation).toHaveBeenCalledTimes(1);
    expect(graphqlOperation).toHaveBeenCalledWith(ListEvents);

    expect(container.firstChild).toMatchSnapshot();
  });
});
