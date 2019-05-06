const fs = require('fs');

const setupEnvFile = () => {
  const stage = process.env.STAGE;
  const destinationFile = `services/common/environment/config.${stage}.json`;
  const envs = {
    region: process.env[`region_${stage}`],
    adminEmail: process.env[`admin_email_${stage}`],
  };

  console.log('Writing envs', envs, 'to file', destinationFile);

  fs.writeFileSync(destinationFile, JSON.stringify(envs, null, 2));
};

setupEnvFile();
