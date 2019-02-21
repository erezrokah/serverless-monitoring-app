import { Callback, Context, Handler } from 'aws-lambda';
import { aggregate } from './aggregator';

export const aggregateData: Handler = (
  event: IAggregatorData,
  context: Context,
  callback: Callback,
) => {
  console.log('processing endpoint results with input:', event);
  const { id, url, logo, name, results } = event;

  const { averageLatencyMs, lastSample, status } = aggregate(results);

  // for notification message
  const message = `The endpoint for service '${name}' is at '${status}' status, Please check!`;

  callback(null, {
    averageLatencyMs,
    id,
    lastSample,
    logo,
    message,
    name,
    status,
    url,
  });
};
