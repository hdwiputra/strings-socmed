const FollowModel = require("../models/FollowModel");

const typeDefs = `#graphql
  type Follow {
    followingId: ID
    followerId: ID
    createdAt: String
    updatedAt: String
  }

  type unfollowResponse {
    message: String
  }

  type Mutation {
    followUser(followingId: ID): Follow
    unfollowUser(followingId: ID): unfollowResponse
  }
`;

const resolvers = {
  Mutation: {
    followUser: async (_, { followingId }, contextValue) => {
      const user = await contextValue.auth();
      const followerId = user._id;
      const params = { followerId, followingId };
      const result = await FollowModel.follow(params);
      return result;
    },
    unfollowUser: async (_, { followingId }, contextValue) => {
      const user = await contextValue.auth();
      const followerId = user._id;
      const params = { followerId, followingId };
      const result = await FollowModel.unfollow(params);
      return result;
    },
  },
};

module.exports = {
  typeDefs,
  resolvers,
};
