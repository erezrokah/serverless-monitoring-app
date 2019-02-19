import { Callback, Context, Handler } from 'aws-lambda';
import { testEndpoint } from './endpointTester';

export const checkEndpoint: Handler = async (
  event: IEndpointData,
  context: Context,
  callback: Callback,
) => {
  console.log('checking endpoint with input:', event);
  const { id, url, logo, name } = event;

  const results: IResultsData[] = await testEndpoint(url);

  callback(null, { id, name, logo, url, results });
};
