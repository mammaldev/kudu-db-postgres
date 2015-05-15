import 'core-js/shim';
import { native as pg } from 'pg';

let defaults = Symbol();

export default class PostgresAdapter {

  get [ defaults ]() {
    return {

      // The column in all model-related tables in which a unique identifier
      // for each row (model instance) should be stored.
      idColumn: 'id',

      // Returns the name of the database table responsible for instances of
      // the given model type. Defaults to the plural name of the model.
      getTableNameFromModel: ( model ) => model.constructor.plural,

      // Returns a 2-dimensional array representing a table of database column
      // names and a single row representing the data of the given model
      // instance. Defaults to a simple map of instance property identifiers to
      // values. This does not handle nested objects or arrays. Values of those
      // types will be treated as JSON.
      getColumnsAndValuesFromModel: ( model ) => {

        let columns = Object.keys(model);
        let values = columns.map(( column ) => model[ column ]);

        // Ignore the 'type' property. By default the type is inferred from the
        // name of the table.
        let index = columns.indexOf('type');
        columns.splice(index, 1);
        values.splice(index, 1);

        return [ columns, values ];
      },
    };
  }

  constructor( kudu, config = {} ) {

    this.config = Object.assign({}, this[ defaults ], config);

    if ( !this.config.connectionString ) {
      throw new Error('No PostgreSQL connection string.');
    }

    this.kudu = kudu;
    this.pg = pg;
  }

  // Insert a new model instance into the database. Returns the same instance
  // with an additional unique identifier property based on the result of the
  // insert operation.
  create( model ) {

    return this.getClient()
    .then(( [ client, done ] ) => {

      let config = this.config;

      // Get the name of the table, the relevant columns and the values to be
      // inserted into those columns in order.
      let table = config.getTableNameFromModel(model);
      let [ columns, values ] = config.getColumnsAndValuesFromModel(model);
      let refs = values.map(( value, i ) => `$${ i + 1 }`);

      // Build the query itself. PostgreSQL table and column names are case-
      // insensitive when unquoted. The query behaves as a SELECT as well as an
      // INSERT and returns the unique identifier of the inserted row.
      let query = `INSERT INTO ${ table } (${ columns }) VALUES (${ refs }) RETURNING ${ config.idColumn }`;

      return new Promise(( resolve, reject ) => {

        client.query(query, values, ( err, res ) => {

          // Release the database connection back to the pool, regardless of
          // whether the query succeeded or failed.
          done();

          if ( err ) {
            return reject(err);
          }

          // The database should have produced an identifier for the new row.
          // We add that to the model instance and return it.
          if ( res.rows && res.rows.length ) {
            model._id = res.rows[ 0 ][ config.idColumn ];
          }

          return resolve(model);
        });
      });
    });
  }

  // Get a connection to the database from the pool. When the connection has
  // done its job the 'done' callback should be invoked to return that
  // conection to the pool.
  getClient() {
    return new Promise(( resolve, reject ) => {

      pg.connect(this.config.connectionString, ( err, client, done ) => {

        if ( err ) {
          return reject(err);
        }

        return resolve([ client, done ]);
      });
    });
  }
}
