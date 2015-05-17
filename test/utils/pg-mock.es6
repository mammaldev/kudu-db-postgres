export default mock;

// A minimal mock for the 'pg' module. Not even close to being feature-complete
// as it only covers the functionality used by default within kudu-db-postgres.
function mock() {}

mock.connect = ( connectionString, cb ) => {

  // Arguments: error object, connection object, callback function.
  cb(null, {

    // Arguments: query string, values array, callback function.
    query( query, values, cb ) {

      if ( /^INSERT/.test(query) ) {
        return cb(null, {
          rows: [ { id: 1 } ],
        });
      }
    }
  }, () => {});
};
