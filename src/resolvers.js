const { authenticated, authorized } = require('./auth');
const NEW_POST = 'NEW_POST';

/**
 * Anything Query / Mutation resolver
 * using a user for a DB query
 * requires user authenication
 */
module.exports = {
  Query: {
    me: authenticated((_, __, { user }) => user),

    posts: authenticated((_, __, { user, models }) =>
      models.Post.findMany({ author: user.id })
    ),

    post: authenticated((_, { id }, { user, models }) =>
      models.Post.findOne({ id, author: user.id })
    ),

    userSettings: authenticated((_, __, { user, models }) =>
      models.Settings.findOne({ user: user.id })
    ),

    // public resolver
    feed: (_, __, { models }) => models.Post.findMany(),
  },

  Mutation: {
    updateSettings: authenticated((_, { input }, { user, models }) =>
      models.Settings.updateOne({ user: user.id }, input)
    ),

    createPost: authenticated((_, { input }, { user, models }) => {
      const post = models.Post.createOne({ ...input, author: user.id });
      pubsub.publish(NEW_POST, { newPost: post });
      return post;
    }),

    updateMe: authenticated((_, { input }, { user, models }) =>
      models.User.updateOne({ id: user.id }, input)
    ),

    // admin role
    invite: authenticated(
      authorized('ADMIN', (_, { input }, { user }) => ({
        from: user.id,
        role: input.role,
        createdAt: Date.now(),
        email: input.email,
      }))
    ),

    signup(_, { input }, { models, createToken }) {
      const existing = models.User.findOne({ email: input.email });

      if (existing) {
        throw new Error('nope');
      }
      const user = models.User.createOne({
        ...input,
        verified: false,
        avatar: 'http',
      });
      const token = createToken(user);
      return { token, user };
    },

    signin(_, { input }, { models, createToken }) {
      const user = models.User.findOne(input);

      if (!user) {
        throw new Error('nope');
      }

      const token = createToken(user);
      return { token, user };
    },
  },

  User: {
    posts: authenticated((root, _, { user, models }) => {
      if (root.id !== user.id) {
        throw new Error('nope');
      }

      return models.Post.findMany({ author: root.id });
    }),

    settings: authenticated((root, __, { user, models }) =>
      models.Settings.findOne({ id: root.settings, user: user.id })
    ),
  },

  Settings: {
    user: authenticated((settings, _, { user, models }) =>
      models.Settings.findOne({ id: settings.id, user: user.id })
    ),
  },

  Post: {
    author: (post, _, { models }) => models.User.findOne({ id: post.author }),
  },
};
