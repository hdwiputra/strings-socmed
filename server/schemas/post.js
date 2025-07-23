const PostModel = require("../models/PostModel");
const redis = require("../config/redis");

const typeDefs = `#graphql
  type Post {
    _id: ID
    content: String
    tags: [String]
    imgUrl: String
    authorId: ID
    userDetails: User
    comments: [Comment]
    likes: [Like]
    createdAt: String
    updatedAt: String
  }

  type User {
    name: String
    username: String
    email: String
  }

  type Comment {
    content: String
    username: String
    createdAt: String
    updatedAt: String
  }

  type Like {
    username: String
    createdAt: String
    updatedAt: String
  }

  type Query {
    getPosts: [Post]
    getPostById(id: ID): Post
  }

  type Mutation {
    createPost(content: String, tags: [String], imgUrl: String): Post
    addComent(content: String, _id: ID): Comment
    addLike(_id: ID): Like
  }
`;

const resolvers = {
  Query: {
    getPosts: async (_, __, contextValue) => {
      await contextValue.auth();
      /*
        Check if posts are cached in Redis
        If cached, return the cached posts
        If not cached, fetch from database and cache the result
      */
      const cachedPosts = await redis.get("posts:all");
      if (cachedPosts) {
        console.log("Returning cached posts");
        return JSON.parse(cachedPosts);
      }
      console.log("Fetching posts from database");
      const posts = await PostModel.getPosts();
      await redis.set("posts:all", JSON.stringify(posts));
      return posts;
    },
    getPostById: async (_, { id }) => {
      const post = await PostModel.getPostById({ id });
      return post;
    },
  },
  Mutation: {
    createPost: async (_, { content, tags, imgUrl }, contextValue) => {
      /*
        do a cache invalidation after creating a post
        This is to ensure that the next time getPosts is called,
        it fetches the latest posts from the database
      */
      const user = await contextValue.auth();
      const authorId = user._id;
      const params = { content, tags, imgUrl, authorId };
      const newPost = await PostModel.createPost(params);
      await redis.del("posts:all");
      console.log("cache invalidated for posts:all");
      console.log(newPost, "<= newPost from createPost in Post");
      return newPost;
    },
    addComent: async (_, { content, _id }, contextValue) => {
      const auth = await contextValue.auth();
      const username = auth.username;
      const params = { content, username, _id };
      const comment = await PostModel.addComment(params);
      await redis.del("posts:all");
      console.log("cache invalidated for posts:all");
      console.log(comment, "<= comment from addComent in Post");
      return comment;
    },
    addLike: async (_, { _id }, contextValue) => {
      const auth = await contextValue.auth();
      const username = auth.username;
      const params = { username, _id };
      const like = await PostModel.addLike(params);
      await redis.del("posts:all");
      console.log("cache invalidated for posts:all");
      console.log(like, "<= like from addLike in Post");
      return like;
    },
  },
};

module.exports = {
  typeDefs,
  resolvers,
};
