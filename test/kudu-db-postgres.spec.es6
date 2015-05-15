import chai from 'chai';

import Adapter from '../src/kudu-db-postgres';

let mockApp = {};
let expect = chai.expect;

const DB_PATH = 'postgres://127.0.0.1:5432/test';

describe('Kudu PostgreSQL adapter', () => {

  let adapter;

  beforeEach(() => {
    adapter = new Adapter(mockApp, {
      connectionString: DB_PATH,
    });
  });

  it('should throw an error when not passed a connection string', () => {
    let test = () => new Adapter(mockApp);
    expect(test).to.throw(Error, /connection string/);
  });

  it('should expose the Kudu app as an instance property', () => {
    expect(adapter.kudu).to.equal(mockApp);
  });
});
