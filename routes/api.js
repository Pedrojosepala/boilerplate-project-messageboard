'use strict';
const mongoose = require('mongoose');

module.exports = function(app, dbUri) {
  if (!dbUri) {
    throw new Error("La variable de entorno DB no está definida. Revisa .env");
  }

  console.log("Conectando a MongoDB con URI:", dbUri);
  mongoose.connect(dbUri);

  const replySchema = new mongoose.Schema({
    text: String,
    created_on: { type: Date, default: Date.now },
    delete_password: String,
    reported: { type: Boolean, default: false }
  });

  const threadSchema = new mongoose.Schema({
    board: String,
    text: String,
    created_on: { type: Date, default: Date.now },
    bumped_on: { type: Date, default: Date.now },
    reported: { type: Boolean, default: false },
    delete_password: String,
    replies: [replySchema]
  });

  const Thread = mongoose.model('Thread', threadSchema);

  app.route('/api/threads/:board')
    .post(async (req, res) => {
      const { text, delete_password } = req.body;
      const board = req.params.board;

      const newThread = new Thread({
        board,
        text,
        delete_password,
        created_on: new Date(),
        bumped_on: new Date(),
        reported: false,
        replies: []
      });

      await newThread.save();

      if (process.env.NODE_ENV === 'test') {
        res.json({ success: true, _id: newThread._id });
      } else {
        res.redirect('/b/' + board + '/');
      }
    })
    .get(async (req, res) => {
      const board = req.params.board;
      const threads = await Thread.find({ board })
        .sort({ bumped_on: -1 })
        .limit(10)
        .lean();

      threads.forEach(t => {
        t.replies = t.replies.slice(-3);
        delete t.delete_password;
        delete t.reported;
        t.replies.forEach(r => {
          delete r.delete_password;
          delete r.reported;
        });
      });

      res.json(threads);
    })
    .delete(async (req, res) => {
      const { thread_id, delete_password } = req.body;
      const thread = await Thread.findById(thread_id);
      if (!thread) return res.send('thread not found');
      if (thread.delete_password !== delete_password) return res.send('incorrect password');

      await Thread.findByIdAndDelete(thread_id);
      res.send('success');
    })
    .put(async (req, res) => {
      const { thread_id } = req.body;
      const thread = await Thread.findById(thread_id);
      if (!thread) return res.send('thread not found');

      thread.reported = true;
      await thread.save();
      res.send('reported');
    });

  app.route('/api/replies/:board')
    .post(async (req, res) => {
      const { text, delete_password, thread_id } = req.body;
      const thread = await Thread.findById(thread_id);
      if (!thread) return res.send('thread not found');

      const reply = {
        text,
        delete_password,
        created_on: new Date(),
        reported: false
      };

      thread.replies.push(reply);
      thread.bumped_on = reply.created_on;
      await thread.save();

      if (process.env.NODE_ENV === 'test') {
        res.json({ success: true, _id: reply._id });
      } else {
        res.redirect('/b/' + req.params.board + '/' + thread._id);
      }
    })
    .get(async (req, res) => {
      const { thread_id } = req.query;
      const thread = await Thread.findById(thread_id).lean();
      if (!thread) return res.send('thread not found');

      delete thread.delete_password;
      delete thread.reported;
      thread.replies.forEach(r => {
        delete r.delete_password;
        delete r.reported;
      });

      res.json(thread);
    })
    .delete(async (req, res) => {
      const { thread_id, reply_id, delete_password } = req.body;
      const thread = await Thread.findById(thread_id);
      if (!thread) return res.send('thread not found');

      const reply = thread.replies.id(reply_id);
      if (!reply) return res.send('reply not found');
      if (reply.delete_password !== delete_password) return res.send('incorrect password');

      reply.text = '[deleted]';
      await thread.save();
      res.send('success');
    })
    .put(async (req, res) => {
      const { thread_id, reply_id } = req.body;
      const thread = await Thread.findById(thread_id);
      if (!thread) return res.send('thread not found');

      const reply = thread.replies.id(reply_id);
      if (!reply) return res.send('reply not found');

      reply.reported = true;
      await thread.save();
      res.send('reported');
    });
};
