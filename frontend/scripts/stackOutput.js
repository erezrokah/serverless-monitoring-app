const { replaceInEnvFile } = require('./utils');

const handler = async (data, serverless) => {
  const { UserPoolClientId } = data;

  await replaceInEnvFile({
    REACT_APP_USER_POOL_WEB_CLIENT_ID: UserPoolClientId,
  });
};

module.exports = { handler };
