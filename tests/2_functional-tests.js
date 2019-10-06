/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const server = require('../server');

chai.use(chaiHttp);

// Jesus Christ, will these tests never end?!

describe('Functional Tests', () => {
  describe('API ROUTING FOR /api/threads/:board', () => {
    describe('POST', () => {
      describe('SUCCESS', function() {
        this.timeout(10000);
        
        after(function(done) {
          chai.request(server)
          .get('/api/threads/chaiboard')
          .end((err, res) => {
            chai.request(server)
            .delete('/api/threads/chaiboard')
            .send({
              thread_id: res.body[0]._id,
              delete_password: 'mypassword'
            })
            .end(() => done());
          });
        });
        
        it('Every field filled', done => {
          chai.request(server)
          .post('/api/threads/chaiboard')
          .send({
            text: 'Hello World',
            delete_password: 'mypassword'
          })
          .end((err, res) => {
            assert.equal(res.statusCode, 200);
            assert.lengthOf(res.redirects, 1);

            done();
          });
        });
      });
      
      describe('FAIL', () => {
        it('Missing password field', done => {
          chai.request(server)
          .post('/api/threads/chaiboard')
          .send({
            text: 'Hello World'
          })
          .end((err, res) => {
            assert.equal(res.statusCode, 400);
            assert.equal(res.text, 'delete_password parameter missing');

            done();
          });
        });

        it('Missing text field', done => {
          chai.request(server)
          .post('/api/threads/chaiboard')
          .send({
            delete_password: 'mypassword'
          })
          .end((err, res) => {
            assert.equal(res.statusCode, 400);
            assert.equal(res.text, 'text parameter missing');

            done();
          });
        });

        it('Missing all fields', done => {
          chai.request(server)
          .post('/api/threads/chaiboard')
          .end((err, res) => {
            assert.equal(res.statusCode, 400);
            assert.equal(res.text, 'text parameter missing');

            done();
          });
        });
      });
    });
    
    describe('GET', () => {
      describe('SUCCESS', function() {
        this.timeout(10000);
        
        let objIds = [];
        
        before(function(done) {
          for (let i = 0; i < 15; i++) {
            chai.request(server)
            .post('/api/threads/chaiboard')
            .send({
              text: 'Testing ' + i,
              delete_password: 'mypassword'
            })
            .end(() => {
              if (i === 14) {
                done();
              }
            });
          }
        });
        
        after(function(done) {
          function cleanupRest(done) {
            let ctr = 0;
            
            chai.request(server)
            .get('/api/threads/chaiboard')
            .end((err, res) => {
              res.body.forEach(t => {
                chai.request(server)
                .delete('/api/threads/chaiboard')
                .send({
                  thread_id: t._id,
                  delete_password: 'mypassword'
                })
                .end(() => {
                  ctr++;

                  if (ctr === 5)
                    done();
                });
              });
            });
          }
          
          let ctr = 0;
          
          objIds.forEach(id => {
            chai.request(server)
            .delete('/api/threads/chaiboard')
            .send({
              thread_id: id,
              delete_password: 'mypassword'
            })
            .end(() => {
              ctr++;
              
              if (ctr === objIds.length)
                cleanupRest(done);
            });
          });
        });

        it('Existing board', done => {
          chai.request(server)
          .get('/api/threads/chaiboard')
          .end((err, res) => {
            assert.equal(res.statusCode, 200);
            assert.isArray(res.body);
            expect(res.body.length).to.be.at.most(10);
            assert.property(res.body[0], '_id');
            assert.property(res.body[0], 'text');
            assert.property(res.body[0], 'created_on');
            assert.property(res.body[0], 'bumped_on');
            assert.property(res.body[0], 'replies');
            expect(res.body[0].replies.length).to.be.at.most(3);
            assert.notProperty(res.body[0], 'reported');
            assert.notProperty(res.body[0], 'delete_password');
            
            res.body.forEach(t => {
              objIds.push(t._id);
            });

            done();
          });
        });
      });
      
      describe('FAIL', () => {
        it('Non existing board', done => {
          chai.request(server)
          .get('/api/threads/nope')
          .end((err, res) => {
            assert.equal(res.statusCode, 200);
            assert.isArray(res.body);
            assert.isEmpty(res.body, 0);

            done();
          });
        });
      });
    });
    
    describe('DELETE', () => {
      describe('SUCCESS', function() {
        this.timeout(10000);

        let id = undefined;

        before(function(done) {
          chai.request(server)
          .post('/api/threads/chaiboard')
          .send({
            text: 'Testing',
            delete_password: 'mypassword'
          })
          .end(() => {
            chai.request(server)
            .get('/api/threads/chaiboard')
            .end((err, res) => {
              id = res.body[0]._id;

              done();
            });
          });
        });
        
        it('Every field filled in', done => {
         chai.request(server)
          .delete('/api/threads/chaiboard')
          .send({
            thread_id: id,
            delete_password: 'mypassword'
          })
          .end((err, res) => {
            assert.equal(res.statusCode, 200);
            assert.equal(res.text, 'success');

            done();
          });
        });
      });
    });
    
    describe('FAIL', function() {
      this.timeout(10000);
      
      let id = undefined;

      before(function(done) {
        chai.request(server)
        .post('/api/threads/chaiboard')
        .send({
          text: 'Testing',
          delete_password: 'mypassword'
        })
        .end(() => {
          chai.request(server)
          .get('/api/threads/chaiboard')
          .end((err, res) => {
            id = res.body[0]._id;

            done();
          });
        });
      });
      
      after(function(done) {
       chai.request(server)
        .delete('/api/threads/chaiboard')
        .send({
          thread_id: id,
          delete_password: 'mypassword'
        })
        .end(() => done());
      });
      
      it('Missing password field', done => {
        chai.request(server)
        .delete('/api/threads/chaiboard')
        .send({ thread_id: id })
        .end((err, res) => {
          assert.equal(res.statusCode, 400);
          assert.equal(res.text, 'delete_password parameter missing');

          done();
        });
      });
      
      it('Missing thread_id field', done => {
        chai.request(server)
        .delete('/api/threads/chaiboard')
        .send({ delete_password: 'mypassword' })
        .end((err, res) => {
          assert.equal(res.statusCode, 400);
          assert.equal(res.text, 'thread_id parameter missing');

          done();
        });
      });
      
      it('Missing all fields', done => {
        chai.request(server)
        .delete('/api/threads/chaiboard')
        .end((err, res) => {
          assert.equal(res.statusCode, 400);
          assert.equal(res.text, 'thread_id parameter missing');

          done();
        });
      });
      
      it('Wrong password field', done => {
        chai.request(server)
        .delete('/api/threads/chaiboard')
        .send({
          thread_id: id,
          delete_password: 'wrongpassword'
        })
        .end((err, res) => {
          assert.equal(res.statusCode, 400);
          assert.equal(res.text, 'incorrect password');

          done();
        });
      });
    });
    
    describe('PUT', () => {
      describe('SUCCESS', function() {
        this.timeout(10000);
        
        let id = undefined;

        before(function(done) {
          chai.request(server)
          .post('/api/threads/chaiboard')
          .send({
            text: 'Testing',
            delete_password: 'mypassword'
          })
          .end(() => {
            chai.request(server)
            .get('/api/threads/chaiboard')
            .end((err, res) => {
              id = res.body[0]._id;

              done();
            });
          });
        });

        after(function(done) {
         chai.request(server)
          .delete('/api/threads/chaiboard')
          .send({
            thread_id: id,
            delete_password: 'mypassword'
          })
          .end(() => done());
        });
        
        it('All fields filled in', done => {
          chai.request(server)
          .put('/api/threads/chaiboard')
          .send({ thread_id: id })
          .end((err, res) => {
            assert.equal(res.statusCode, 200);
            assert.equal(res.text, 'success');

            done();
          });
        });
      });
      
      describe('FAIL', () => {
        it('Missing thread_id field', done => {
          chai.request(server)
          .put('/api/threads/chaiboard')
          .end((err, res) => {
            assert.equal(res.statusCode, 400);
            assert.equal(res.text, 'thread_id parameter missing');

            done();
          });
        });
        
        it('Invalid thread_id format', done => {
          chai.request(server)
          .put('/api/threads/chaiboard')
          .send({
            thread_id: '5d993e154a8df56eec6604m2',
          })
          .end((err, res) => {
            assert.equal(res.statusCode, 400);
            assert.equal(res.text, 'thread_id format is not valid');

            done();
          });
        });
        
        it('Nonexisting thread_id', done => {
          chai.request(server)
          .put('/api/threads/chaiboard')
          .send({
            thread_id: '5d993e154a8df56eec660452',
          })
          .end((err, res) => {
            assert.equal(res.statusCode, 500);
            assert.equal(res.text, 'could not process request');

            done();
          });
        });
      });
    });
  });
  
  describe('API ROUTING FOR /api/replies/:board', () => {
    describe('POST', () => {
      describe('SUCCESS', function() {
        this.timeout(10000);
        
        let id = undefined;

        before(function(done) {
          chai.request(server)
          .post('/api/threads/chaiboard')
          .send({
            text: 'Testing',
            delete_password: 'mypassword'
          })
          .end(() => {
            chai.request(server)
            .get('/api/threads/chaiboard')
            .end((err, res) => {
              id = res.body[0]._id;

              done();
            });
          });
        });

        after(function(done) {
         chai.request(server)
          .delete('/api/threads/chaiboard')
          .send({
            thread_id: id,
            delete_password: 'mypassword'
          })
          .end(() => done());
        });
        
        it('All fields filled in', done => {
          chai.request(server)
          .post('/api/replies/chaiboard')
          .send({
            thread_id: id,
            text: 'Test reply 1',
            delete_password: 'mypassword'
          })
          .end((err, res) => {
            assert.equal(res.statusCode, 200);
            assert.lengthOf(res.redirects, 1);

            done();
          });
        });
      });
      
      describe('FAIL', function() {
        this.timeout(10000);
        
        let id = undefined;

        before(function(done) {
          chai.request(server)
          .post('/api/threads/chaiboard')
          .send({
            text: 'Testing',
            delete_password: 'mypassword'
          })
          .end(() => {
            chai.request(server)
            .get('/api/threads/chaiboard')
            .end((err, res) => {
              id = res.body[0]._id;

              done();
            });
          });
        });

        after(function(done) {
         chai.request(server)
          .delete('/api/threads/chaiboard')
          .send({
            thread_id: id,
            delete_password: 'mypassword'
          })
          .end(() => done());
        });
        
        it('Missing text parameter', done => {
          chai.request(server)
          .post('/api/replies/chaiboard')
          .send({
            thread_id: id,
            delete_password: 'mypassword'
          })
          .end((err, res) => {
            assert.equal(res.statusCode, 400);
            assert.equal(res.text, 'text parameter missing');

            done();
          });
        });
          
        it('Missing delete_password parameter', done => {
          chai.request(server)
          .post('/api/replies/chaiboard')
          .send({
            thread_id: id,
            text: 'Test reply 1'
          })
          .end((err, res) => {
            assert.equal(res.statusCode, 400);
            assert.equal(res.text, 'delete_password parameter missing');

            done();
          });
        });
        
        it('Missing thread_id parameter', done => {
          chai.request(server)
          .post('/api/replies/chaiboard')
          .send({
            text: 'Test reply 1',
            delete_password: 'mypassword'
          })
          .end((err, res) => {
            assert.equal(res.statusCode, 400);
            assert.equal(res.text, 'thread_id parameter missing');

            done();
          });
        });
        
        it('Missing all fields', done => {
          chai.request(server)
          .post('/api/replies/chaiboard')
          .end((err, res) => {
            assert.equal(res.statusCode, 400);
            assert.equal(res.text, 'text parameter missing');

            done();
          });
        });
      });
    });
    
    describe('GET', () => {
      describe('SUCCESS', function() {
        this.timeout(10000);
        
        let id = undefined;

        before(function(done) {
          chai.request(server)
          .post('/api/threads/chaiboard')
          .send({
            text: 'Testing',
            delete_password: 'mypassword'
          })
          .end(() => {
            chai.request(server)
            .get('/api/threads/chaiboard')
            .end((err, res) => {
              id = res.body[0]._id;
              
              chai.request(server)
              .post('/api/replies/chaiboard')
              .send({
                thread_id: res.body[0]._id,
                text: 'Test reply 1',
                delete_password: 'mypassword'
              })
              .end(() => done());
            });
          });
        });

        after(function(done) {
         chai.request(server)
          .delete('/api/threads/chaiboard')
          .send({
            thread_id: id,
            delete_password: 'mypassword'
          })
          .end(() => done());
        });
        
        it('All fields filled in', done => {
          chai.request(server)
          .get('/api/replies/chaiboard')
          .query({ thread_id: id })
          .end((err, res) => {
            assert.equal(res.statusCode, 200);
            assert.property(res.body, '_id');
            assert.property(res.body, 'text');
            assert.property(res.body, 'created_on');
            assert.property(res.body, 'bumped_on');
            assert.property(res.body, 'replies');
            assert.lengthOf(res.body.replies, 1);
            assert.notProperty(res.body.replies[0], 'reported');
            assert.notProperty(res.body.replies[0], 'delete_password');
            assert.notProperty(res.body, 'reported');
            assert.notProperty(res.body, 'delete_password');

            done();
          });
        });
      });
      
      describe('FAIL', () => {
        it('Missing thread_id field', done => {
          chai.request(server)
          .get('/api/replies/chaiboard')
          .end((err, res) => {
            assert.equal(res.statusCode, 400);
            assert.equal(res.text, 'thread_id parameter missing');

            done();
          });
        });
        
        it('Invalid thread_id format', done => {
          chai.request(server)
          .get('/api/replies/chaiboard')
          .query( {thread_id: '5d993e154a8df56eec6604m2' } )
          .end((err, res) => {
            assert.equal(res.statusCode, 400);
            assert.equal(res.text, 'thread_id format is not valid');

            done();
          });
        });
        
        it('Nonexisting thread_id', done => {
          chai.request(server)
          .get('/api/replies/chaiboard')
          .query({ thread_id: '5d993e154a8df56eec660452' })
          .end((err, res) => {
            assert.equal(res.statusCode, 500);
            assert.equal(res.text, 'could not process request');

            done();
          });
        });
      });
    });
    
    describe('PUT', () => {
      describe('SUCCESS', function() {
        this.timeout(10000);
        
        let id = undefined;
        let reply_id = undefined;

        before(function(done) {
          chai.request(server)
          .post('/api/threads/chaiboard')
          .send({
            text: 'Testing',
            delete_password: 'mypassword'
          })
          .end(() => {
            chai.request(server)
            .get('/api/threads/chaiboard')
            .end((err, res) => {
              id = res.body[0]._id;
              
              chai.request(server)
              .post('/api/replies/chaiboard')
              .send({
                thread_id: res.body[0]._id,
                text: 'Test reply 1',
                delete_password: 'mypassword'
              })
              .end(() => {
                chai.request(server)
                .get('/api/threads/chaiboard')
                .end((err, res) => {
                  reply_id = res.body[0].replies[0]._id;
                  done();
                });
              });
            });
          });
        });

        after(function(done) {
         chai.request(server)
          .delete('/api/threads/chaiboard')
          .send({
            thread_id: id,
            delete_password: 'mypassword'
          })
          .end(() => done());
        });
        
        it('All fields filled in', done => {
          chai.request(server)
          .put('/api/replies/chaiboard')
          .send({
            thread_id: id,
            reply_id: reply_id
          })
          .end((err, res) => {
            assert.equal(res.statusCode, 200);
            assert.equal(res.text, 'success');

            done();
          });
        });
      });
      
      describe('FAIL', function() {
        this.timeout(10000);
        
        let id = undefined;
        let reply_id = undefined;

        before(function(done) {
          chai.request(server)
          .post('/api/threads/chaiboard')
          .send({
            text: 'Testing',
            delete_password: 'mypassword'
          })
          .end(() => {
            chai.request(server)
            .get('/api/threads/chaiboard')
            .end((err, res) => {
              id = res.body[0]._id;
              
              chai.request(server)
              .post('/api/replies/chaiboard')
              .send({
                thread_id: res.body[0]._id,
                text: 'Test reply 1',
                delete_password: 'mypassword'
              })
              .end(() => {
                chai.request(server)
                .get('/api/threads/chaiboard')
                .end((err, res) => {
                  reply_id = res.body[0].replies[0]._id;
                  done();
                });
              });
            });
          });
        });

        after(function(done) {
         chai.request(server)
          .delete('/api/threads/chaiboard')
          .send({
            thread_id: id,
            delete_password: 'mypassword'
          })
          .end(() => done());
        });
        
        it('Missing all fields', done => {
          chai.request(server)
          .put('/api/replies/chaiboard')
          .end((err, res) => {
            assert.equal(res.statusCode, 400);
            assert.equal(res.text, 'thread_id parameter missing');

            done();
          });
        });
        
        it('Missing thread_id field', done => {
          chai.request(server)
          .put('/api/replies/chaiboard')
          .send({ reply_id: reply_id })
          .end((err, res) => {
            assert.equal(res.statusCode, 400);
            assert.equal(res.text, 'thread_id parameter missing');

            done();
          });
        });
        
        it('Invalid thread_id format', done => {
          chai.request(server)
          .put('/api/replies/chaiboard')
          .send({
            thread_id: '5d993e154a8df56eec6604m2',
            reply_id: reply_id
          })
          .end((err, res) => {
            assert.equal(res.statusCode, 400);
            assert.equal(res.text, 'thread_id format is not valid');

            done();
          });
        });
        
        it('Nonexisting thread_id', done => {
          chai.request(server)
          .put('/api/replies/chaiboard')
          .send({
            thread_id: '5d993e154a8df56eec660452',
            reply_id: reply_id
          })
          .end((err, res) => {
            assert.equal(res.statusCode, 500);
            assert.equal(res.text, 'could not process request');

            done();
          });
        });
        
        it('Missing reply_id field', done => {
          chai.request(server)
          .put('/api/replies/chaiboard')
          .send({
            thread_id: id,
          })
          .end((err, res) => {
            assert.equal(res.statusCode, 400);
            assert.equal(res.text, 'reply_id parameter missing');

            done();
          });
        });
        
        it('Invalid reply_id format', done => {
          chai.request(server)
          .put('/api/replies/chaiboard')
          .send({
            thread_id: id,
            reply_id: '5d993e154a8df56eec6604m2'
          })
          .end((err, res) => {
            assert.equal(res.statusCode, 400);
            assert.equal(res.text, 'reply_id format is not valid');

            done();
          });
        });
        
        it('Nonexisting reply_id', done => {
          chai.request(server)
          .put('/api/replies/chaiboard')
          .send({
            thread_id: id,
            reply_id: '5d993e154a8df56eec660452'
          })
          .end((err, res) => {
            assert.equal(res.statusCode, 500);
            assert.equal(res.text, 'could not process request');

            done();
          });
        });
      });
    });
    
    describe('DELETE', () => {
      describe('SUCCESS', function() {
        this.timeout(10000);
        
        let id = undefined;
        let reply_id = undefined;

        before(function(done) {
          chai.request(server)
          .post('/api/threads/chaiboard')
          .send({
            text: 'Testing',
            delete_password: 'mypassword'
          })
          .end(() => {
            chai.request(server)
            .get('/api/threads/chaiboard')
            .end((err, res) => {
              id = res.body[0]._id;
              
              chai.request(server)
              .post('/api/replies/chaiboard')
              .send({
                thread_id: res.body[0]._id,
                text: 'Test reply 1',
                delete_password: 'mypassword'
              })
              .end(() => {
                chai.request(server)
                .get('/api/threads/chaiboard')
                .end((err, res) => {
                  reply_id = res.body[0].replies[0]._id;
                  done();
                });
              });
            });
          });
        });

        after(function(done) {
         chai.request(server)
          .delete('/api/threads/chaiboard')
          .send({
            thread_id: id,
            delete_password: 'mypassword'
          })
          .end(() => done());
        });
        
        it('All fields filled in', done => {
          chai.request(server)
          .delete('/api/replies/chaiboard')
          .send({
            thread_id: id,
            reply_id: reply_id,
            delete_password: 'mypassword'
          })
          .end((err, res) => {
            assert.equal(res.statusCode, 200);
            assert.equal(res.text, 'success');

            done();
          });
        });
      });
      
      describe('FAIL', function() {
        this.timeout(10000);
        
        let id = undefined;
        let reply_id = undefined;

        before(function(done) {
          chai.request(server)
          .post('/api/threads/chaiboard')
          .send({
            text: 'Testing',
            delete_password: 'mypassword'
          })
          .end(() => {
            chai.request(server)
            .get('/api/threads/chaiboard')
            .end((err, res) => {
              id = res.body[0]._id;
              
              chai.request(server)
              .post('/api/replies/chaiboard')
              .send({
                thread_id: res.body[0]._id,
                text: 'Test reply 1',
                delete_password: 'mypassword'
              })
              .end(() => {
                chai.request(server)
                .get('/api/threads/chaiboard')
                .end((err, res) => {
                  reply_id = res.body[0].replies[0]._id;
                  done();
                });
              });
            });
          });
        });

        after(function(done) {
         chai.request(server)
          .delete('/api/threads/chaiboard')
          .send({
            thread_id: id,
            delete_password: 'mypassword'
          })
          .end(() => done());
        });
        
        it('Missing all fields', done => {
          chai.request(server)
          .delete('/api/replies/chaiboard')
          .end((err, res) => {
            assert.equal(res.statusCode, 400);
            assert.equal(res.text, 'thread_id parameter missing');

            done();
          });
        });
        
        it('Missing thread_id field', done => {
          chai.request(server)
          .delete('/api/replies/chaiboard')
          .send({
              reply_id: reply_id,
              delete_password: 'mypassword'
          })
          .end((err, res) => {
            assert.equal(res.statusCode, 400);
            assert.equal(res.text, 'thread_id parameter missing');

            done();
          });
        });
        
        it('Invalid thread_id format', done => {
          chai.request(server)
          .delete('/api/replies/chaiboard')
          .send({
            thread_id: '5d993e154a8df56eec6604m2',
            reply_id: reply_id,
            delete_password: 'mypassword'
          })
          .end((err, res) => {
            assert.equal(res.statusCode, 400);
            assert.equal(res.text, 'thread_id format is not valid');

            done();
          });
        });

        it('Missing reply_id field', done => {
          chai.request(server)
          .delete('/api/replies/chaiboard')
          .send({
            thread_id: id,
            delete_password: 'mypassword'
          })
          .end((err, res) => {
            assert.equal(res.statusCode, 400);
            assert.equal(res.text, 'reply_id parameter missing');

            done();
          });
        });
        
        it('Invalid reply_id format', done => {
          chai.request(server)
          .delete('/api/replies/chaiboard')
          .send({
            thread_id: id,
            reply_id: '5d993e154a8df56eec6604m2',
            delete_password: 'mypassword'
          })
          .end((err, res) => {
            assert.equal(res.statusCode, 400);
            assert.equal(res.text, 'reply_id format is not valid');

            done();
          });
        });
        
        it('Missing delete_password field', done => {
          chai.request(server)
          .delete('/api/replies/chaiboard')
          .send({
            thread_id: id,
            reply_id: reply_id,
          })
          .end((err, res) => {
            assert.equal(res.statusCode, 400);
            assert.equal(res.text, 'delete_password parameter missing');

            done();
          });
        });
        
        it('Wrong delete_password', done => {
          chai.request(server)
          .delete('/api/replies/chaiboard')
          .send({
            thread_id: id,
            reply_id: reply_id,
            delete_password: 'wrongpassword'
          })
          .end((err, res) => {
            assert.equal(res.statusCode, 400);
            assert.equal(res.text, 'incorrect password');

            done();
          });
        });
      });
    });
  });
});
