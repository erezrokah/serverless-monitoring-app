const { spawn } = require('child_process');

const runSpawnCommand = async (command, args) => {
  const promise = new Promise((resolve, reject) => {
    const cmd = spawn(command, args);

    cmd.stdout.on('data', data => {
      console.log(data.toString());
    });

    cmd.stderr.on('data', data => {
      console.log(data.toString());
    });

    cmd.on('close', code => {
      const message = `${command} process exited with code ${code}`;
      if (code) {
        reject(message);
      } else {
        resolve(message);
      }
    });
  });

  await promise;
};

const deployFrontend = async () => {
  const argv = require('minimist')(process.argv.slice(2));
  const { stage } = argv;
  if (!stage) {
    throw new Error('Missing required stage argument');
  }
  console.log(`Deploying frontend to stage "${stage}"`);

  await runSpawnCommand('yarn', ['run', 'deploy:stack', '--stage', stage]);
  await runSpawnCommand('yarn', ['run', 'build']);
  await runSpawnCommand('yarn', ['run', 'publish', '--stage', stage]);
};

deployFrontend();
