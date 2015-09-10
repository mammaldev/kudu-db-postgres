export default mock;

// A minimal mock for the 'pg' module. Not even close to being feature-complete
// as it only covers the functionality used by default within kudu-db-postgres.
function mock() {}

mock.connect = ( connectionString, cb ) => {

  // Arguments: error object, connection object, callback function.
  cb(null, {

    // Arguments: query string, values array, callback function.
    query( query, values, cb ) {

      if ( typeof values === 'function' ) {
        cb = values;
      }

      if ( /^INSERT/.test(query) ) {
        return cb(null, {
          rows: [ { id: 1 } ],
        });
      }

      if ( /^SELECT/.test(query) ) {

        if ( /"fails"/.test(query) ) {
          return cb(new Error());
        }

        return cb(null, {
          rows: [ { id: 1 } ],
        });
      }

      return cb(new Error('Not implemented in mock.'));
    },
  }, () => {});
};
