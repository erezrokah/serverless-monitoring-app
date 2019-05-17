import * as MockDate from 'mockdate';
import { aggregate } from './aggregator';

const date = '1948/1/1';
MockDate.set(date);

describe('aggregator', () => {
  test('should return status ERROR on many errors', () => {
    const results = new Array(15).fill({ error: true, duration: -1 });
    expect(aggregate(results)).toEqual({
      averageLatencyMs: -1,
      lastSample: new Date().toISOString(),
      status: 'ERROR',
    });
  });

  test('should return status WARNING on average latency >= 2000', () => {
    const results = new Array(15).fill({ error: false, duration: 3000 });
    expect(aggregate(results)).toEqual({
      averageLatencyMs: 3000,
      lastSample: new Date().toISOString(),
      status: 'WARNING',
    });
  });

  test('should return status PASS on average latency < 2000', () => {
    const results = new Array(15).fill({ error: false, duration: 1000 });
    expect(aggregate(results)).toEqual({
      averageLatencyMs: 1000,
      lastSample: new Date().toISOString(),
      status: 'PASS',
    });
  });
});
