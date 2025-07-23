import { Image, Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { gql, useMutation } from "@apollo/client";
import { useEffect, useState } from "react";
import { getSecure } from "../helpers/secureStore";
import Toast from "react-native-toast-message";

const ADD_LIKE = gql`
  mutation AddLike($id: ID) {
    addLike(_id: $id) {
      username
    }
  }
`;

const GET_POSTS = gql`
  query UsersById($usersByIdId: ID) {
    usersById(id: $usersByIdId) {
      username
      followings {
        username
      }
    }
    getPosts {
      authorId
      comments {
        content
        createdAt
        updatedAt
        username
      }
      content
      imgUrl
      likes {
        createdAt
        updatedAt
        username
      }
      tags
      updatedAt
      createdAt
      userDetails {
        email
        name
        username
      }
    }
  }
`;

export default function PostCard({ post, currentUsername, followings }) {
  const { navigate } = useNavigation();
  const [likePost] = useMutation(ADD_LIKE);
  const [userId, setUserId] = useState(null);

  const formatCreatedAt = (createdAt) => {
    if (!createdAt) return "";

    try {
      let date;

      // Handle different timestamp formats
      if (typeof createdAt === "string") {
        // Try parsing as ISO string first
        date = new Date(createdAt);

        // If invalid, try parsing as number string
        if (isNaN(date.getTime())) {
          const timestamp = parseInt(createdAt);
          if (!isNaN(timestamp) && timestamp > 0) {
            date = new Date(timestamp);
          }
        }
      } else if (typeof createdAt === "number") {
        date = new Date(createdAt);
      } else {
        return "";
      }

      // Validate the final date
      if (!date || isNaN(date.getTime()) || date.getFullYear() < 2000) {
        console.log("Invalid date detected:", createdAt);
        return "Invalid date";
      }

      // Format: DD/MM/YYYY HH:MM
      return date.toLocaleString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch (error) {
      console.log("Error formatting date:", error, "for timestamp:", createdAt);
      return "Error formatting date";
    }
  };

  const isLikedByCurrentUser = () => {
    if (!currentUsername || !post.likes) return false;
    return post.likes.some((like) => like.username === currentUsername);
  };

  const handleLike = async () => {
    try {
      console.log("Liking post...");
      const result = await likePost({
        variables: { id: post._id },
        refetchQueries: [
          {
            query: GET_POSTS,
            variables: {
              usersByIdId: userId,
            },
          },
        ],
      });
      console.log(result.data.addLike, "Post liked successfully");

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Post liked successfully",
      });
    } catch (error) {
      console.log(error, "Error liking post");
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to like post",
      });
    }
  };

  useEffect(() => {
    const fetchUserId = async () => {
      const id = await getSecure("userId");
      console.log(id, "userId");
      setUserId(id);
    };
    fetchUserId();
  }, []);

  return (
    <Pressable
      onPress={() => {
        console.log("Card pressed");
        navigate("Details", {
          postId: post._id,
          currentUsername,
          followings: followings || [],
        });
      }}
    >
      <View style={styles.card}>
        <View style={styles.userInfo}>
          <View style={styles.profilePicture}>
            <Text style={styles.initials}>
              {post.userDetails?.username?.[0]?.toUpperCase() || "?"}
            </Text>
          </View>
          <View style={styles.userTextInfo}>
            <Text style={styles.username}>{post.userDetails?.username}</Text>
            <Text style={styles.relativeTime}>
              {formatCreatedAt(post.createdAt)}
            </Text>
          </View>
        </View>
        <Text style={styles.content}>{post.content}</Text>
        {post.imgUrl && (
          <Image source={{ uri: post.imgUrl }} style={styles.image} />
        )}
        <Text style={styles.tags}>Tags: {post.tags.join(", ")}</Text>
        <View style={styles.actionContainer}>
          <Pressable
            style={styles.actionButton}
            onPress={() => {
              console.log("Comment pressed");
              navigate("Details", {
                postId: post._id,
                currentUsername,
                followings: followings || [],
              });
            }}
          >
            <Ionicons name="chatbubble-outline" size={18} color="#71767b" />
            <Text style={styles.actionText}>{post.comments.length}</Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={handleLike}>
            <Ionicons
              name={isLikedByCurrentUser() ? "heart" : "heart-outline"}
              size={18}
              color={isLikedByCurrentUser() ? "#f91880" : "#71767b"}
            />
            <Text style={styles.actionText}>{post.likes.length}</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = {
  card: {
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#333",
    backgroundColor: "#000",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1d9bf0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  initials: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  userTextInfo: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  relativeTime: {
    fontSize: 13,
    color: "#71767b",
  },
  content: {
    fontSize: 15,
    lineHeight: 20,
    color: "#fff",
    marginBottom: 12,
  },
  image: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    marginBottom: 12,
  },
  tags: {
    fontSize: 13,
    color: "#1d9bf0",
    marginBottom: 12,
    fontWeight: "500",
  },
  actionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 8,
    borderRadius: 20,
  },
  actionText: {
    fontSize: 13,
    color: "#71767b",
    fontWeight: "500",
  },
};
