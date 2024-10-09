const { execSync } = require('child_process');

(() => {
  execSync('yarn run electron-builder install-app-deps --platform win32', {
    stdio: 'inherit',
  });
})();
