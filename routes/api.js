/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const expect = require('chai').expect;
const ThreadHandler = require('./../controllers/ThreadHandler.js');

const whenEverythingFails = (req, res) => res.status(500).send('could not process request');

module.exports = app => {
  app.route('/api/threads/:board')
  .get(ThreadHandler.validateDbConnection,
       ThreadHandler.validateGetParameters,
       // I believe aggregates could have been used for this
       // but this is not a professional environment
       // so it's not really worth the effort
       ThreadHandler.getRecentThreads,
       whenEverythingFails)
  
  .post(ThreadHandler.validateDbConnection,
        ThreadHandler.validatePostParameters,
        ThreadHandler.postThread,
        whenEverythingFails)
  
  .put(ThreadHandler.validateDbConnection,
       ThreadHandler.validatePutParameters,
       ThreadHandler.reportThread,
       whenEverythingFails)
  
  .delete(ThreadHandler.validateDbConnection,
          ThreadHandler.validateDeleteParameters,
          ThreadHandler.deleteThread,
          whenEverythingFails);
    
  app.route('/api/replies/:board')
  .get(ThreadHandler.validateDbConnection,
       ThreadHandler.validateGetParameters,
       // I believe aggregates could have been used for this
       // but this is not a professional environment
       // so it's not really worth the effort
       ThreadHandler.getThread,
       whenEverythingFails)
  
  .post(ThreadHandler.validateDbConnection,
        ThreadHandler.validatePostParameters,
        ThreadHandler.postReply,
        whenEverythingFails)
  
  .put(ThreadHandler.validateDbConnection,
       ThreadHandler.validatePutParameters,
       ThreadHandler.reportReply,
       whenEverythingFails)
  
  .delete(ThreadHandler.validateDbConnection,
          ThreadHandler.validateDeleteParameters,
          ThreadHandler.deleteReply,
          whenEverythingFails);
};
