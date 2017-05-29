const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  username: String,

  numPosts: { type: Number, default: 0 }, //not including replys

  turkID: String,

  group: String, //full group type
  ui: String,    //just UI type (no or ui)
  notify: String, //notification type (no, low or high)

  tokens: Array,

  posts: [new Schema({
    postID: Number,  //number for this post (1,2,3...) reply get -1
    body: {type: String, default: '', trim: true},
    picture: String,

    reply: {type: Schema.ObjectId, ref: 'Script'},
    absTime: Date,
    relativeTime: {type: Number}
    })],

  feedAction: [new Schema({
        post: {type: Schema.ObjectId, ref: 'Script'},
        postClass: String,
        rereadTimes: Number, //number of times post has been viewed by user
        startTime: Number, //always the newest startTime (full date in ms)
        readTime : [Number],
        flagTime  : [Number],
        likeTime  : [Number],
        replyTime  : [Number]
    }, {_id: true})],

  profile: {
    name: String,
    gender: String,
    location: String,
    bio: String,
    website: String,
    picture: String
  }
}, { timestamps: true });

/**
 * Password hash middleware.
 */
userSchema.pre('save', function save(next) {
  const user = this;
  if (!user.isModified('password')) { return next(); }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }
    bcrypt.hash(user.password, salt, null, (err, hash) => {
      if (err) { return next(err); }
      user.password = hash;
      next();
    });
  });
});

/**
 * Helper method for validating user's password.
 */
userSchema.methods.comparePassword = function comparePassword(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    cb(err, isMatch);
  });
};

/**
 * Helper method for getting user's gravatar.
 */
userSchema.methods.gravatar = function gravatar(size) {
  if (!size) {
    size = 200;
  }
  if (!this.email) {
    return `https://gravatar.com/avatar/?s=${size}&d=retro`;
  }
  const md5 = crypto.createHash('md5').update(this.email).digest('hex');
  return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

const User = mongoose.model('User', userSchema);

module.exports = User;

/* Garbage snips
    new Schema({ //{type: Schema.ObjectId, ref: 'Script'},
      body: {type: String, default: '', trim: true},
      picture: String,
      time: Number,
      actorName: String,
      actorPicture: String,
      actorUserName: String}),
    */
