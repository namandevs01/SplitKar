const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/mysql/User');
const MongoUser = require('../models/mongo/UserProfile');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find or create user in MySQL
        let user = await User.findOne({ where: { googleId: profile.id } });

        if (!user) {
          // Check if email already exists
          user = await User.findOne({ where: { email: profile.emails[0].value } });
          if (user) {
            // Link google account to existing user
            await user.update({ googleId: profile.id, isVerified: true });
          } else {
            // Create new user
            user = await User.create({
              name: profile.displayName,
              email: profile.emails[0].value,
              googleId: profile.id,
              isVerified: true,
              authProvider: 'google',
            });

            // Create MongoDB profile
            await MongoUser.create({
              userId: user.id,
              avatar: profile.photos[0]?.value || '',
              preferences: { currency: 'INR', language: 'en' },
            });
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
