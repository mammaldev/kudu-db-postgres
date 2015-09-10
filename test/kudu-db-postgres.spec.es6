import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

import Adapter from '../src/kudu-db-postgres';
import mock from './utils/pg-mock';

chai.use(chaiAsPromised);

let mockApp = {};
let expect = chai.expect;

const DB_PATH = 'postgres://127.0.0.1:5432/test';

describe('Kudu PostgreSQL adapter', () => {

  let adapter;

  beforeEach(() => {
    adapter = new Adapter(mockApp, {
      connectionString: DB_PATH,
      client: mock,
    });
  });

  it('should throw an error when not passed a connection string', () => {
    let test = () => new Adapter(mockApp);
    expect(test).to.throw(Error, /connection string/);
  });

  it('should expose the Kudu app as an instance property', () => {
    expect(adapter.kudu).to.equal(mockApp);
  });

  describe('default configuration', () => {

    describe('getTableNameFromModel', () => {

      let Model;

      beforeEach(() => {
        Model = () => {};
        Model.plural = 'tests';
      });

      it('should return the plural name of a Kudu model', () => {
        let instance = new Model();
        expect(adapter.config.getTableNameFromModel(instance)).to.equal('tests');
      });
    });

    describe('getColumnsAndValuesFromModel', () => {

      it('should return a 2-dimensional array of object keys to values', () => {
        let instance = { key: 'value' };
        expect(adapter.config.getColumnsAndValuesFromModel(instance))
        .to.deep.equal([ [ 'key' ], [ 'value' ] ]);
      });

      it('should ignore the "type" property', () => {
        let instance = { key: 'value', type: 'type' };
        expect(adapter.config.getColumnsAndValuesFromModel(instance))
        .to.deep.equal([ [ 'key' ], [ 'value' ] ]);
      });
    });
  });

  describe('#getClient', () => {

    it('should return a connection object and a callback function', ( done ) => {
      adapter.getClient().then(( [ conn, cb ] ) => {
        try {
          expect(conn).to.be.an('object');
          expect(cb).to.be.a('function');
          done();
        } catch ( err ) {
          done(err);
        }
      });
    });
  });

  describe('#create', () => {

    it('should return the given model instance', () => {
      let instance = {};
      return expect(adapter.create(instance)).to.become(instance);
    });

    it('should add a unique identifier to the model instance', () => {
      let instance = {};
      return expect(adapter.create(instance)).to.eventually.have.property('_id');
    });
  });

  describe('#get', () => {

    it('should return a single row when given a valid model and identifier', () => {
      let Model = makeMockModel('test', 'tests');
      return expect(adapter.get(Model, 1)).to.eventually.have.property('type', 'test');
    });

    it('should return an error if the client throws', () => {
      let Model = makeMockModel('fail', 'fails');
      return expect(adapter.get(Model, 1)).to.eventually.be.rejectedWith(Error);
    });
  });

  describe('#getAll', () => {

    it('should return an array when given a valid model', () => {
      let Model = makeMockModel('test', 'tests');
      return expect(adapter.getAll(Model)).to.eventually.be.an('array');
    });

    it('should return an error if the client throws', () => {
      let Model = makeMockModel('fail', 'fails');
      return expect(adapter.getAll(Model)).to.eventually.be.rejectedWith(Error);
    });
  });
});

function makeMockModel( singular, plural ) {
  let Model = () => {};
  Model.singular = singular;
  Model.plural = plural;
  return Model;
}
