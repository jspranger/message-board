const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const threadSchema = mongoose.Schema({
  _id: mongoose.Types.ObjectId,
  text: { type: String, required: true },
  delete_password: { type: String, required: true },
  reported: { type: Boolean, default: false },
  created_on: Date,
  bumped_on: Date,
  replies: [{
    _id: mongoose.Types.ObjectId,
    text: { type: String, required: true },
    delete_password: { type: String, required: true },
    reported: { type: Boolean, default: false },
    created_on: Date
  }]
});

let db = undefined;

mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true }, (err, result) => {
  if (err) {
    console.log(err);
    throw err;
  }
  
  db = result;
});

const saltRounds = 10;

const validateDbConnection = (req, res, next) => {
  if (db === undefined)
    return res.status(500).send('database unreachable');
  
  next();
};

const validatePostParameters = (req, res, next) => {
  if (req.params.board === undefined || req.params.board.length <= 0)
    return res.status(400).send('board parameter missing');

  if (req.body.text === undefined || req.body.text.length <= 0)
    return res.status(400).send('text parameter missing');

  if (req.body.delete_password === undefined || req.body.delete_password.length <= 0)
    return res.status(400).send('delete_password parameter missing');
  
  next();
};

const postThread = (req, res, next) => {
  bcrypt.hash(req.body.delete_password, saltRounds, (err, hash) => {
    if (err)
      return res.status(500).send('unknown error');

    const ThreadModel = mongoose.model(req.params.board, threadSchema);

    ThreadModel.create({
      _id: new mongoose.Types.ObjectId(),
      text: req.body.text,
      delete_password: hash,
      created_on: new Date(),
      bumped_on: new Date()
    }, (err, result) => {
      if (err)
        return res.status(500).send('could not create thread');
      
      if (result)
        return res.redirect(`/b/${req.params.board}`);
      
      next();
    });
  });
};

const postReply = (req, res, next) => {
  if (req.body.thread_id === undefined )
    return res.status(400).send('thread_id parameter missing');
  
  if (mongoose.Types.ObjectId.isValid(req.body.thread_id) === false)
    return res.status(400).send('thread_id format is not valid');
  
  bcrypt.hash(req.body.delete_password, saltRounds, (err, hash) => {
    if (err)
      return res.status(500).send('unknown error');

    const ThreadModel = mongoose.model(req.params.board, threadSchema);

    ThreadModel.findOneAndUpdate({
      _id: new mongoose.Types.ObjectId(req.body.thread_id),
    }, {
      '$push': {
        'replies': {
          _id: new mongoose.Types.ObjectId(),
          text: req.body.text,
          delete_password: hash,
          created_on: new Date()
        }
      },
      bumped_on: new Date()
    }, {
      new: true,
      useFindAndModify: false
    }, (err, result) => {
      if (err) {
          return res.status(500).send('could not create thread');
        }

      if (result)
        return res.redirect(`/b/${req.params.board}/${req.body.thread_id}`);

      next();
    });
  });
};

const validateGetParameters = (req, res, next) => {
  if (req.params.board === undefined || req.params.board.length <= 0)
    return res.status(400).send('board parameter missing');

  next();
};

const getRecentThreads = (req, res, next) => {
  const ThreadModel = mongoose.model(req.params.board, threadSchema);

  // I believe aggregates could have been used for this
  // but this is not a professional environment
  // so it's not really worth the effort
  ThreadModel.find({}).select('_id text created_on bumped_on replies._id replies.text replies.created_on').sort({ bumped_on: -1 }).limit(10).exec((err, result) => {
    if (err)
      return res.status(500).send('could not retrieve threads');
    
    if (result) {
      result.forEach(value => {
        value.replies =
          value.replies.sort((a, b) => b > a).splice(0, 3)
      });
      
      return res.json(result);
    }
    
    next();
  });
};

const getThread = (req, res, next) => {
  if (req.query.thread_id === undefined)
    return res.status(400).send('thread_id parameter missing');
  
  if (mongoose.Types.ObjectId.isValid(req.query.thread_id) === false)
    return res.status(400).send('thread_id format is not valid');

  const ThreadModel = mongoose.model(req.params.board, threadSchema);

  // I believe aggregates could have been used for this
  // but this is not a professional environment
  // so it's not really worth the effort
  ThreadModel.findOne({
    _id: new mongoose.Types.ObjectId(req.query.thread_id)
  }).select('_id text created_on bumped_on replies._id replies.text replies.created_on').exec((err, result) => {
    if (err)
      return res.status(500).send('could not retrieve thread');
    
    if (result)
      return res.json(result);
    
    next();
  });
};

const validatePutParameters = (req, res, next) => {
  if (req.params.board === undefined || req.params.board.length <= 0)
    return res.status(400).send('board parameter missing');

  if (req.body.thread_id === undefined || req.body.thread_id.length <= 0)
    return res.status(400).send('thread_id parameter missing');
  
  if (mongoose.Types.ObjectId.isValid(req.body.thread_id) === false)
    return res.status(400).send('thread_id format is not valid');
  
  next();
};

const reportThread = (req, res, next) => {
  const ThreadModel = mongoose.model(req.params.board, threadSchema);

  ThreadModel.findOneAndUpdate({
    _id: new mongoose.Types.ObjectId(req.body.thread_id),
  }, {
    reported: true
  }, {
    new: true,
    useFindAndModify: false
  }, (err, result) => {
    if (err)
      return res.status(500).send('could not report thread');

    if (result)
      return res.send('success');

    next();
  });
};

const reportReply = (req, res, next) => {
  if (req.body.reply_id === undefined || req.body.reply_id.length <= 0)
    return res.status(400).send('reply_id parameter missing');
  
  if (mongoose.Types.ObjectId.isValid(req.body.reply_id) === false)
    return res.status(400).send('reply_id format is not valid');
  
  const ThreadModel = mongoose.model(req.params.board, threadSchema);

  ThreadModel.findOneAndUpdate({
    _id: req.body.thread_id,
    'replies._id': new mongoose.Types.ObjectId(req.body.reply_id)
  }, {
      $set: { 'replies.$.reported' : true }
  }, {
    new: true,
    useFindAndModify: false
  }, (err, result) => {
    if (err)
      return res.status(500).send('could not report thread');

    if (result)
      return res.send('success');

    next();
  });
};

const validateDeleteParameters = (req, res, next) => {
  if (req.params.board === undefined || req.params.board.length <= 0)
    return res.status(400).send('board parameter missing');

  if (req.body.thread_id === undefined || req.body.thread_id.length <= 0)
    return res.status(400).send('thread_id parameter missing');
  
  if (mongoose.Types.ObjectId.isValid(req.body.thread_id) === false)
    return res.status(400).send('thread_id format is not valid');

  if (req.body.delete_password === undefined || req.body.delete_password.length <= 0)
    return res.status(400).send('delete_password parameter missing');
  
  next();
};

const deleteThread = (req, res, next) => {
  const ThreadModel = mongoose.model(req.params.board, threadSchema);
  
  ThreadModel.findOne({
    _id: new mongoose.Types.ObjectId(req.body.thread_id),
  }, (err, result) => {
    if (err)
      return res.status(500).send('unknown error');
    
    bcrypt.compare(req.body.delete_password, result.delete_password, (herr, hresult) => {
      if (herr)
        return res.status(500).send('unknown error');
      
      if (hresult) {
        ThreadModel.deleteOne({
          _id: new mongoose.Types.ObjectId(req.body.thread_id),
        }, (derr, dresult) => {
          if (err)
            return res.status(500).send('could not delete thread');

          if (result)
            return res.send('success');

          next();
        });
      } else return res.status(400).send('incorrect password');
    });
  });
};

const deleteReply = (req, res, next) => {
  if (req.body.reply_id === undefined || req.body.reply_id.length <= 0)
    return res.status(400).send('reply_id parameter missing');
  
  if (mongoose.Types.ObjectId.isValid(req.body.reply_id) === false)
    return res.status(400).send('reply_id format is not valid');
  
  const ThreadModel = mongoose.model(req.params.board, threadSchema);
  
  ThreadModel.aggregate([
    { '$match': { '_id' : new mongoose.Types.ObjectId(req.body.thread_id) } },
    { '$unwind': '$replies' },
    { '$match': { 'replies._id' : new mongoose.Types.ObjectId(req.body.reply_id) } }
  ]).exec((err, result) => {
    if (err)
      return res.status(500).send('unknown error');

      bcrypt.compare(req.body.delete_password, result[0].replies.delete_password, (herr, hresult) => {
        if (herr)
          return res.status(500).send('unknown error');
        
        if (hresult) {
          ThreadModel.findOneAndUpdate({
            'replies._id' : new mongoose.Types.ObjectId(req.body.reply_id)
          }, {
            '$set': { 'replies.$.text': '[deleted]' }
          }, {
            new: true,
            useFindAndModify: false
          }, (uerr, uresult) => {
            if (uerr)
              return res.status(500).send('unknown error');

            if (uresult)
              return res.send('success');
            
            next();
          });
        } else return res.status(400).send('incorrect password');
      });
  });
};

module.exports = {
  validateDbConnection,
  validatePostParameters,
  postThread,
  postReply,
  validateGetParameters,
  getRecentThreads,
  getThread,
  validatePutParameters,
  reportThread,
  reportReply,
  validateDeleteParameters,
  deleteThread,
  deleteReply
};
