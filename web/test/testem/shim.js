
define('mocha', function() {
  return {describe: window.describe, it: window.it, before: window.before};
});

define('expect.js', function() {
  return window.expect;
});

