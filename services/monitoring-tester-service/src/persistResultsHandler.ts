import { Callback, Context, Handler } from 'aws-lambda';

export const persistResults: Handler = (
  event: IAggregatedResults,
  context: Context,
  callback: Callback,
) => {
  console.log('persisting results with input:', event);
  console.log(event);

  const { id, url, logo, name, averageLatencyMs, status, lastSample } = event;

  callback(null, {
    averageLatencyMs,
    id,
    lastSample,
    logo,
    name,
    status,
    url,
  });
};
