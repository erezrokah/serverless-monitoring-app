import { API, Amplify } from 'aws-amplify';
import { GRAPHQL_AUTH_MODE } from '@aws-amplify/api-graphql';
import { Callback, Context, Handler } from 'aws-lambda';

export const updateDataEntry = `mutation updateDataEntry($input: DataEntryInput) {
  updateDataEntry(input: $input) {
    id
    url,
    logo,
    name,
    averageLatencyMs,
    status,
    lastSample
  }
}
`;

const myAppConfig = {
  aws_appsync_authenticationType: 'AWS_IAM',
  aws_appsync_graphqlEndpoint: process.env.GRAPHQL_ENDPOINT_URL,
  aws_appsync_region: process.env.AWS_REGION,
};

Amplify.configure(myAppConfig);

export const persistResults: Handler = async (
  event: IAggregatedResults,
  context: Context,
  callback: Callback,
) => {
  console.log('persisting results with input:', event);

  const { id, url, logo, name, averageLatencyMs, status, lastSample } = event;

  try {
    await API.graphql({
      authMode: GRAPHQL_AUTH_MODE.AWS_IAM,
      query: updateDataEntry,
      variables: {
        input: { id, url, logo, name, averageLatencyMs, status, lastSample },
      },
    });
  } catch (e) {
    console.error(e);
  }

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
