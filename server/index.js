require("dotenv").config();

const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { verifyToken } = require("./helpers/jwt");
const UserModel = require("./models/UserModel");

const {
  typeDefs: userTypeDefs,
  resolvers: userResolvers,
} = require("./schemas/user");

const {
  typeDefs: postTypeDefs,
  resolvers: postResolvers,
} = require("./schemas/post");

const {
  typeDefs: followTypeDefs,
  resolvers: followResolvers,
} = require("./schemas/follow");

const server = new ApolloServer({
  typeDefs: [userTypeDefs, postTypeDefs, followTypeDefs],
  resolvers: [userResolvers, postResolvers, followResolvers],
  introspection: true,
});

startStandaloneServer(server, {
  listen: { port: 80 },
  context: ({ req }) => {
    return {
      auth: async () => {
        if (!req.headers.authorization) {
          throw new Error("Authorization header is missing");
        }

        const rawToken = req.headers.authorization.split(" ");
        const tokenType = rawToken[0];
        const tokenValue = rawToken[1];

        if (tokenType !== "Bearer") {
          throw new Error("Invalid token");
        }

        const decodedToken = verifyToken(tokenValue);
        const user = await UserModel.findOne({
          _id: decodedToken.id,
        });

        if (!user) {
          throw new Error("Invalid token");
        }

        return user;
      },
    };
  },
}).then(({ url }) => {
  console.log(`🚀  Server ready at: ${url}`);
});
