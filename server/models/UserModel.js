const { database } = require("../config/mongodb");
const { hashPassword, compPassword } = require("../helpers/bcrypt");
const { signToken } = require("../helpers/jwt");
const { ObjectId } = require("mongodb");

class UserModel {
  static collection() {
    return database.collection("users");
  }

  static async create(newUser) {
    if (!newUser.username) {
      throw new Error("Username is required");
    }

    // check apakah usernamenya unique
    const existingUsername = await this.collection().findOne({
      username: newUser.username,
    });
    if (existingUsername) {
      throw new Error("Username already exists");
    }

    if (!newUser.email) {
      throw new Error("Email is required");
    }

    // check apakah email formatnya valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      throw new Error("Invalid email format");
    }

    // check apakah emailnya unique
    const existingEmail = await this.collection().findOne({
      email: newUser.email,
    });
    if (existingEmail) {
      throw new Error("Email already exists");
    }

    if (!newUser.password) {
      throw new Error("Password is required");
    }

    if (newUser.password.length < 5) {
      throw new Error("Password must be at least 5 characters long");
    }

    const result = await this.collection().insertOne({
      name: newUser.name,
      username: newUser.username,
      email: newUser.email,
      password: hashPassword(newUser.password),
    });
    return result;
  }

  static async login(params) {
    const { usernameEmail, password } = params;
    if (!usernameEmail || !password) {
      throw new Error("Username/Email and password are required");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(usernameEmail);

    const user = await this.collection().findOne(
      isEmail ? { email: usernameEmail } : { username: usernameEmail }
    );

    if (!user) {
      throw new Error("Invalid username/email/password");
    }

    const comparePassword = compPassword(password, user.password);
    if (!comparePassword) {
      throw new Error("Invalid username/email/password");
    }

    const access_token = signToken({ id: user._id.toString() });

    const token = {
      access_token: access_token,
      message: `Selamat datang, ${user.username}!`,
      userId: `${user._id.toString()}`,
    };

    return token;
  }

  static async findOne(params) {
    if (!params) {
      throw new Error("ID is required");
    }

    const user = await this.collection().findOne({
      _id: new ObjectId(params._id),
    });
    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  static async findUser(params) {
    const { nameUsername } = params;
    if (!nameUsername) {
      throw new Error("name/username is required");
    }

    const regexQuery = {
      $or: [
        { name: { $regex: nameUsername, $options: "i" } },
        { username: { $regex: nameUsername, $options: "i" } },
      ],
    };

    const agg = [
      { $match: regexQuery },
      {
        $lookup: {
          from: "follows",
          localField: "_id",
          foreignField: "followerId",
          as: "followings",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "followings.followingId",
          foreignField: "_id",
          as: "followings",
        },
      },
      {
        $lookup: {
          from: "follows",
          localField: "_id",
          foreignField: "followingId",
          as: "followers",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "followers.followerId",
          foreignField: "_id",
          as: "followers",
        },
      },
      {
        $project: {
          "followings.password": 0,
          "followers.password": 0,
          password: 0, // jangan lupa hide password user utama juga
        },
      },
    ];

    const users = await this.collection().aggregate(agg).toArray();

    if (!users.length) {
      throw new Error("No users found matching the search criteria");
    }

    return users;
  }

  static async findById(id) {
    if (!id) {
      throw new Error("ID is required");
    }

    const agg = [
      {
        $match: { _id: new ObjectId(id) },
      },
      {
        $lookup: {
          from: "follows",
          localField: "_id",
          foreignField: "followerId",
          as: "followings",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "followings.followingId",
          foreignField: "_id",
          as: "followings",
        },
      },
      {
        $project: {
          "followings.password": 0,
        },
      },
      {
        $lookup: {
          from: "follows",
          localField: "_id",
          foreignField: "followingId",
          as: "followers",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "followers.followerId",
          foreignField: "_id",
          as: "followers",
        },
      },
      {
        $project: {
          "followers.password": 0,
        },
      },
    ];

    // const user = await this.collection().findOne({ _id: new ObjectId(id) });
    const user = await this.collection().aggregate(agg).toArray();
    console.log(user);

    if (!user) {
      throw new Error("User not found");
    }

    return user[0];
  }
}

module.exports = UserModel;
