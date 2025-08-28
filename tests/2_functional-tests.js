require('dotenv').config();
const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

describe('Functional Tests', function() {
  let testThreadId;
  let testReplyId;

  // === THREADS ===
  it('Creating a new thread: POST request to /api/threads/{board}', function(done) {
    chai.request(server)
      .post('/api/threads/test')
      .send({
        text: 'Test thread',
        delete_password: 'pass123'
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        done();
      });
  });

  it('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function(done) {
    chai.request(server)
      .get('/api/threads/test')
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.isAtMost(res.body.length, 10);
        testThreadId = res.body[0]._id;
        done();
      });
  });

  it('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board}', function(done) {
    chai.request(server)
      .delete('/api/threads/test')
      .send({ thread_id: testThreadId, delete_password: 'wrongpass' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  it('Reporting a thread: PUT request to /api/threads/{board}', function(done) {
    chai.request(server)
      .put('/api/threads/test')
      .send({ thread_id: testThreadId })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'reported');
        done();
      });
  });

  // === REPLIES ===
  it('Creating a new reply: POST request to /api/replies/{board}', function(done) {
    chai.request(server)
      .post('/api/replies/test')
      .send({
        text: 'Test reply',
        delete_password: 'replypass',
        thread_id: testThreadId
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        done();
      });
  });

  it('Viewing a single thread with all replies: GET request to /api/replies/{board}', function(done) {
    chai.request(server)
      .get('/api/replies/test')
      .query({ thread_id: testThreadId })
      .end((err, res) => {
        assert.equal(res.status, 200);
        testReplyId = res.body.replies[0]._id;
        done();
      });
  });

  it('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board}', function(done) {
    chai.request(server)
      .delete('/api/replies/test')
      .send({ thread_id: testThreadId, reply_id: testReplyId, delete_password: 'wrongpass' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  it('Reporting a reply: PUT request to /api/replies/{board}', function(done) {
    chai.request(server)
      .put('/api/replies/test')
      .send({ thread_id: testThreadId, reply_id: testReplyId })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'reported');
        done();
      });
  });

  it('Deleting a reply with the correct password: DELETE request to /api/replies/{board}', function(done) {
    chai.request(server)
      .delete('/api/replies/test')
      .send({ thread_id: testThreadId, reply_id: testReplyId, delete_password: 'replypass' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        done();
      });
  });

  // Cleanup
  it('Deleting a thread with the correct password: DELETE request to /api/threads/{board}', function(done) {
    chai.request(server)
      .delete('/api/threads/test')
      .send({ thread_id: testThreadId, delete_password: 'pass123' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        done();
      });
  });

});