var Promise = require('bluebird');
var PouchDB = require('pouchdb');
var replicationStream = require('pouchdb-replication-stream');
var MemoryStream = require('memorystream');
var expect = require('chai').expect;

PouchDB.plugin(replicationStream.plugin);
PouchDB.adapter('writableStream', replicationStream.adapters.writableStream);

describe('pouchdb-replication-stream replication', function() {
  this.timeout(60000);

  it('should replicate identical _revs into the destination database', function(done) {

    var db1 = new PouchDB('mydb1');
    var db2 = new PouchDB('mydb2');

    var testdoc1_revs = [];
    var testdoc2_revs = [];

    var stream = new MemoryStream();

    db1.bulkDocs([
      {_id: 'testdoc1'},
      {_id: 'testdoc2'}
    ])
      .then(function() {
        return db1.dump(stream);
      })
      .then(function () {
        return db2.load(stream);
      })
      .then(function() {
        console.log('yo again');
        return Promise.props({
          db1: db1.allDocs(),
          db2: db2.allDocs()
        });
      })
      .then(function(docs) {
        testdoc1_revs.push(docs.db1.rows[0].value.rev);
        testdoc1_revs.push(docs.db2.rows[0].value.rev);
        testdoc2_revs.push(docs.db1.rows[1].value.rev);
        testdoc2_revs.push(docs.db2.rows[1].value.rev);
        return Promise.all([db1.destroy(), db2.destroy()]);
      })
      .then(function() {
        console.log('testdoc1: ' + testdoc1_revs[0] + ', ' + testdoc1_revs[1]);
        console.log('testdoc2: ' + testdoc2_revs[0] + ', ' + testdoc2_revs[1]);
        expect(testdoc1_revs[0]).to.equal(testdoc1_revs[1]);
        expect(testdoc2_revs[0]).to.equal(testdoc2_revs[1]);
        done();
      })
  });

});
