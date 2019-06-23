import { aggregateData } from './aggregateDataHandler';

jest.mock('./aggregator');

describe('aggregateDataHandler', () => {
  test('should call aggregate and invoke callback', () => {
    const { aggregate } = require('./aggregator');

    const result = {
      averageLatencyMs: '2000',
      lastSample: new Date().toISOString(),
      status: 'PASS',
    };
    aggregate.mockReturnValue(result);

    const event = {
      id: 'id',
      logo: 'logo',
      name: 'name',
      results: [{ error: false, duration: 1000 }],
      url: 'url',
    };
    const callback = jest.fn();

    aggregateData(event, null as any, callback);

    const { results, ...rest } = event;

    expect(aggregate).toHaveBeenCalledTimes(1);
    expect(aggregate).toHaveBeenCalledWith(results);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(null, {
      ...rest,
      ...result,
      message: `The endpoint for service '${event.name}' is at '${result.status}' status, Please check!`,
    });
  });
});
