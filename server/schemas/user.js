const UserModel = require("../models/UserModel");

const typeDefs = `#graphql
  type User {
    _id: ID
    name: String
    username: String
    email: String
    followings: [following]
    followers: [follower]
  }

  type following {
    _id: ID
    name: String
    username: String
    email: String
  }

  type follower {
    _id: ID
    name: String
    username: String
    email: String
  }

  type LoginResponse {
    access_token: String
    message: String
    userId: String
  }

  type Query {
    users: [User]
    usersByName(nameUsername: String): [User]
    usersById(id: ID): User
    loginResponses: [LoginResponse]
  }

  type Mutation {
    createUser(name: String, username: String, email: String, password: String): User
    login(usernameEmail: String, password: String): LoginResponse
  }
`;

const resolvers = {
  Query: {
    users: () => users,
    usersByName: async (_, { nameUsername }, contextValue) => {
      await contextValue.auth();
      const params = { nameUsername };
      const users = await UserModel.findUser(params);
      return users;
    },
    usersById: async (_, { id }, contextValue) => {
      await contextValue.auth();
      const params = { id };
      const user = await UserModel.findById(params);
      if (!user) {
        throw new Error("User not found");
      }
      return user;
    },
  },
  Mutation: {
    createUser: async (_, { name, username, email, password }) => {
      const newUser = { name, username, email, password };
      await UserModel.create(newUser);
      return newUser;
    },
    login: async (_, { usernameEmail, password }) => {
      const params = { usernameEmail, password };
      const token = await UserModel.login(params);
      return token;
    },
  },
};

module.exports = {
  typeDefs,
  resolvers,
};
