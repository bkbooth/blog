const childProcess = require('child_process');

const result = childProcess.spawnSync('hugo', ['version']);

if (result.error) {
  console.error('hugo not found. You must setup hugo (https://gohugo.io/overview/installing/) before continuing.');
  process.exit(1);
} else {
  console.log('hugo found.');
}
