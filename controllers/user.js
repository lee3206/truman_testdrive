const bluebird = require('bluebird');
const crypto = bluebird.promisifyAll(require('crypto'));
const nodemailer = require('nodemailer');
const passport = require('passport');
const moment = require('moment');
const User = require('../models/User');
const Notification = require('../models/Notification.js');

/**
 * GET /login
 * Login page.
 */
exports.getLogin = (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('account/login', {
    title: 'Login'
  });
};

/*************
Get Notifcation Bell signal
**************/
exports.checkBell = (req, res) => {
if (req.user) {

    var user = req.user;

    Notification.find({ $or: [ { userPost: user.numPosts  }, { userReply: user.numReplies }, { actorReply: user.numActorReplies } ] })
        .populate('actor')
        .exec(function (err, notification_feed) {

          if (err) { return next(err); }

          if (notification_feed.length == 0)
          {
            //peace out - send empty page - 
            //or deal with replys or something IDK
            console.log("No User Posts yet. Bell is black");
            return res.send({result:false}); 
          }

          //We have values we need to check
          //When this happens
          else{

            for (var i = 0, len = notification_feed.length; i < len; i++) {

              //Do all things that reference userPost (read,like, actual copy of ActorReply)
              if (notification_feed[i].userPost >= 0)
              {

                var userPostID = notification_feed[i].userPost;
                var user_post = user.getUserPostByID(userPostID);
                var time_diff = Date.now() - user_post.absTime;
                if (user.lastNotifyVisit)
                {
                  var past_diff = user.lastNotifyVisit - user_post.absTime;
                }
                
                else
                {
                  var past_diff = 0;
                }

                if(notification_feed[i].time <= time_diff && notification_feed[i].time > past_diff)
                {
                  return res.send({result:true});
                }

              }//UserPost

            }//for loop

            //end of for loop and no results, so no new stuff
            console.log("&&Bell Check&& End of For Loop, no Results")
            res.send({result:false});
          }


        });//Notification exec


  }

 else{
  console.log("No req.user")
  return res.send({result:false});
}
};


/**
 * POST /login
 * Sign in using email and password.
 */
exports.postLogin = (req, res, next) => {
  //req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password cannot be blank').notEmpty();
  req.assert('username', 'Username cannot be blank').notEmpty();
  //req.sanitize('email').normalizeEmail({ remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/login');
  }

  passport.authenticate('local', (err, user, info) => {
    if (err) { return next(err); }
    if (!user) {
      req.flash('errors', info);
      return res.redirect('/login');
    }
    if (!(user.active)) {
      console.log("FINAL");
      req.flash('final', { msg: '' });
      return res.redirect('/login');
    }
    req.logIn(user, (err) => {
      if (err) { return next(err); }
      //req.flash('success', { msg: 'Success! You are logged in.' });
      res.redirect(req.session.returnTo || '/');
    });
  })(req, res, next);
};

/**
 * GET /logout
 * Log out.
 TODO - add code to take survey?? or check if you have seen experinetal post yet
 */
exports.logout = (req, res) => {
  req.logout();
  res.redirect('/login');
};

/**
 * GET /signup
 * Signup page.
 */
exports.getSignup = (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('account/signup', {
    title: 'Create Account'
  });
};

/**
 * POST /signup
 * Create a new local account.
 */
exports.postSignup = (req, res, next) => {
  req.assert('username', 'Username cannot be blank').notEmpty();
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
  req.assert('signupcode', 'Wrong Sign Up Code').equals("0451");
  
  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/signup');
  }

  //random assignment of experimental group
  const user = new User({
    password: req.body.password,
    username: req.body.username,
    group: 'no:no',
    active: true,
    ui: 'no', //ui or no
    notify: 'no', //no, low or high
    lastNotifyVisit : Date.now()
  });

  User.findOne({ username: req.body.username }, (err, existingUser) => {
    if (err) { return next(err); }
    if (existingUser) {
      req.flash('errors', { msg: 'Account with that Username already exists.' });
      return res.redirect('/signup');
    }
    user.save((err) => {
      if (err) { return next(err); }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        res.redirect('/account/signup_info');
      });
    });
  });
};



/**
 * POST /account/profile
 * Update profile information.
 */
exports.postSignupInfo = (req, res, next) => {


  User.findById(req.user.id, (err, user) => {
    if (err) { return next(err); }
    //user.email = req.body.email || '';
    user.profile.name = req.body.name || '';
    user.profile.location = req.body.location || '';
    user.profile.bio = req.body.bio || '';

    if (req.file)
    {
      //console.log("Changeing Picture now to: "+ req.file.filename);
      user.profile.picture = req.file.filename;
    }

    user.save((err) => {
      if (err) {
        if (err.code === 11000) {
          req.flash('errors', { msg: 'The email address you have entered is already associated with an account.' });
          return res.redirect('/signup_info');
        }
        return next(err);
      }
      req.flash('success', { msg: 'Profile information has been updated.' });
      res.redirect('/com');
    });
  });
};

/**
 * GET /account
 * Profile page.
 */
exports.getAccount = (req, res) => {
  res.render('account/profile', {
    title: 'Account Management'
  });
};

/**
 * GET /signup_info
 * Signup Info page.
 */
exports.getSignupInfo = (req, res) => {

  res.render('account/signup_info', {
    title: 'Add Information'
  });
};

/**
 * GET /account
 * Profile page.
 */
exports.getMe = (req, res) => {

  User.findById(req.user.id)
  .populate({ 
       path: 'posts.reply',
       model: 'Script',
       populate: {
         path: 'actor',
         model: 'Actor'
       } 
    })
  .exec(function (err, user) {
    if (err) { return next(err); }

    var allPosts = user.getPostsAndReplies();

    res.render('me', { posts: allPosts });

  });


};

/**
 * POST /account/profile
 * Update profile information.
 */
exports.postUpdateProfile = (req, res, next) => {
  req.assert('email', 'Please enter a valid email address.').isEmail();
  req.sanitize('email').normalizeEmail({ remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account');
  }

  User.findById(req.user.id, (err, user) => {
    if (err) { return next(err); }
    //user.email = req.body.email || '';
    user.profile.name = req.body.name || '';
    //user.profile.gender = req.body.gender || '';
    user.profile.location = req.body.location || '';
    //user.profile.website = req.body.website || '';
    user.profile.bio = req.body.bio || '';

    if (req.file)
    {
      console.log("Changeing Picture now to: "+ req.file.filename);
      user.profile.picture = req.file.filename;
    }

    user.save((err) => {
      if (err) {
        if (err.code === 11000) {
          req.flash('errors', { msg: 'The email address you have entered is already associated with an account.' });
          return res.redirect('/account');
        }
        return next(err);
      }
      req.flash('success', { msg: 'Profile information has been updated.' });
      res.redirect('/account');
    });
  });
};

/**
 * POST /account/password
 * Update current password.
 */
exports.postUpdatePassword = (req, res, next) => {
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account');
  }

  User.findById(req.user.id, (err, user) => {
    if (err) { return next(err); }
    user.password = req.body.password;
    user.save((err) => {
      if (err) { return next(err); }
      req.flash('success', { msg: 'Password has been changed.' });
      res.redirect('/account');
    });
  });
};

/**
 * POST /account/delete
 * Delete user account.
 */
exports.postDeleteAccount = (req, res, next) => {
  User.remove({ _id: req.user.id }, (err) => {
    if (err) { return next(err); }
    req.logout();
    req.flash('info', { msg: 'Your account has been deleted.' });
    res.redirect('/');
  });
};

/**
 * GET /account/unlink/:provider
 * Unlink OAuth provider.
 */
exports.getOauthUnlink = (req, res, next) => {
  const provider = req.params.provider;
  User.findById(req.user.id, (err, user) => {
    if (err) { return next(err); }
    user[provider] = undefined;
    user.tokens = user.tokens.filter(token => token.kind !== provider);
    user.save((err) => {
      if (err) { return next(err); }
      req.flash('info', { msg: `${provider} account has been unlinked.` });
      res.redirect('/account');
    });
  });
};

/**
 * GET /reset/:token
 * Reset Password page.
 */
exports.getReset = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  User
    .findOne({ passwordResetToken: req.params.token })
    .where('passwordResetExpires').gt(Date.now())
    .exec((err, user) => {
      if (err) { return next(err); }
      if (!user) {
        req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
        return res.redirect('/forgot');
      }
      res.render('account/reset', {
        title: 'Password Reset'
      });
    });
};
