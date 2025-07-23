const { database } = require("../config/mongodb");
const { ObjectId } = require("mongodb");

class PostModel {
  static collection() {
    return database.collection("posts");
  }

  static async createPost(params) {
    let { content, tags, imgUrl, authorId } = params;

    if (!content) {
      throw new Error("Content is required");
    }

    if (!authorId) {
      throw new Error("Author ID is required");
    }

    if (!tags) {
      tags = [];
    }

    const result = await this.collection().insertOne({
      content,
      tags,
      imgUrl,
      authorId,
      comments: [],
      likes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const post = await this.collection().findOne({
      _id: result.insertedId,
    });
    return post;
  }

  static async getPosts() {
    const agg = [
      {
        $lookup: {
          from: "users",
          localField: "authorId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          "userDetails._id": false,
          "userDetails.password": false,
        },
      },
      { $sort: { createdAt: -1 } },
    ];
    const posts = await this.collection().aggregate(agg).toArray();
    return posts;
  }

  static async getPostById(params) {
    console.log(params);
    const { id } = params;
    const _id = new ObjectId(id);

    const agg = [
      {
        $match: { _id },
      },
      {
        $lookup: {
          from: "users",
          localField: "authorId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          "userDetails._id": false,
          "userDetails.password": false,
        },
      },
    ];

    const posts = await this.collection().aggregate(agg).toArray();
    return posts[0] || null;
  }

  static async addComment(params) {
    let { content, username, _id } = params;

    if (!content) {
      throw new Error("Content is required");
    }

    if (!username) {
      throw new Error("Username is required");
    }

    if (!_id) {
      throw new Error("Post ID is required");
    }

    console.log(username, "<= username from addComent");
    _id = new ObjectId(_id);

    const comment = await this.collection().findOneAndUpdate(
      { _id },
      {
        $push: {
          comments: {
            content,
            username,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: "after" }
    );
    console.log(comment, "<= comment from addComent");
    return comment.comments[comment.comments.length - 1];
  }

  static async addLike(params) {
    let { username, _id } = params;

    if (!username) {
      throw new Error("Username is required");
    }

    if (!_id) {
      throw new Error("Post ID is required");
    }

    _id = new ObjectId(_id);

    // validasi apakah pengguna sudah menyukai postingan ini
    const existingPost = await this.collection().findOne({
      _id,
      "likes.username": username,
    });

    if (existingPost) {
      throw new Error("User has already liked this post");
    }

    const like = await this.collection().findOneAndUpdate(
      { _id },
      {
        $push: {
          likes: {
            username,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: "after" }
    );
    return like.likes[like.likes.length - 1];
  }
}

module.exports = PostModel;
