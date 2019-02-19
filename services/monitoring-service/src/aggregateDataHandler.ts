import { Callback, Context, Handler } from 'aws-lambda';
import { aggregate } from './aggregator';

export const aggregateData: Handler = async (
  event: IAggregatorData,
  context: Context,
  callback: Callback,
) => {
  console.log('processing endpoint results with input:', event);
  const { id, url, logo, name, results } = event;

  const { averageLatencyMs, lastSample, status } = aggregate(results);

  callback(null, { id, name, url, logo, averageLatencyMs, lastSample, status });
};
