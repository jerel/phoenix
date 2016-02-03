var fs = require('fs'),
    glob = require('glob'),
    rollup = require( 'rollup' ),
    babel = require('babel-core');

glob('./web/test/**/*_test.js', function(err, tests) {

  tests.forEach(function(test) {
    var dest = test.replace('web/test', 'web/test/testem/_build').replace('.js', '.es5.js');
    rollup.rollup({
      // The bundle's starting point. Since each test is
      // equivalent to an app we iterate over then and build
      // a "bundle" for each test file.
      entry: test
    }).then( function ( bundle ) {
      var result = bundle.generate({
        // output format - 'amd', 'cjs', 'es6', 'iife', 'umd'
        format: 'amd'
      });
      bundle.write({
        format: 'amd',
        dest: dest,
      }).then(function() {
        babel.transformFile(dest, {sourceMaps: 'inline'}, function(err, result) {
          fs.writeFile(dest, result.code);
        });
      });
    });
  });

});
