const readline = require('readline');
const { spawn } = require('child_process');

const runSpawnCommand = async (command, args) => {
  const promise = new Promise((resolve, reject) => {
    const proc = spawn(command, args);

    const stdout = readline.createInterface({
      input: proc.stdout,
      terminal: false,
    });

    const stderr = readline.createInterface({
      input: proc.stderr,
      terminal: false,
    });

    stdout.on('line', line => {
      console.log(line);
    });

    stderr.on('line', line => {
      console.log(line);
    });

    proc.on('close', code => {
      const message = `${command} process exited with code ${code}`;
      if (code) {
        reject({ message, code });
      } else {
        resolve({ message, code });
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

  try {
    await runSpawnCommand('yarn', ['run', 'deploy:stack', '--stage', stage]);
    await runSpawnCommand('yarn', ['run', 'build']);
    await runSpawnCommand('yarn', ['run', 'publish', '--stage', stage]);
  } catch (e) {
    process.exit(e.code);
  }
};

deployFrontend();
