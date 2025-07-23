const { database } = require("../config/mongodb");
const { ObjectId } = require("mongodb");
const UserModel = require("./UserModel");

class FollowModel {
  static collection() {
    return database.collection("follows");
  }

  static async follow(params) {
    let { followerId, followingId } = params;
    followingId = new ObjectId(followingId);

    if (!followerId || !followingId) {
      throw new Error("Follower ID and Following ID are required");
    }

    if (followerId.toString() === followingId.toString()) {
      throw new Error("You cannot follow yourself");
    }

    const user = await database.collection("users").findOne({
      _id: followingId,
    });

    if (!user) {
      throw new Error("User not found");
    }

    const existingFollow = await this.collection().findOne({
      followerId,
      followingId,
    });

    if (existingFollow) {
      throw new Error("You are already following this user");
    }

    const result = await this.collection().insertOne({
      followerId,
      followingId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const follow = await this.collection().findOne({
      _id: result.insertedId,
    });

    return follow;
  }

  static async unfollow(params) {
    let { followerId, followingId } = params;
    followingId = new ObjectId(followingId);

    if (!followerId || !followingId) {
      throw new Error("Follower ID and Following ID are required");
    }

    const existingFollow = await this.collection().findOne({
      followerId,
      followingId,
    });

    if (!existingFollow) {
      throw new Error("You are not following this user");
    }

    await this.collection().deleteOne({
      followerId,
      followingId,
    });

    const user = await UserModel.findOne({ _id: followingId });

    return {
      message: `Successfully unfollowed the ${user.username}.`,
    };
  }
}

module.exports = FollowModel;
