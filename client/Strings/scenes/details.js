import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { gql, useMutation, useQuery } from "@apollo/client";
import { useState, useEffect, useCallback } from "react";
import { getSecure } from "../helpers/secureStore";
import Toast from "react-native-toast-message";
import Modal from "react-native-modal";

// Query dan Mutasi GraphQL
const GET_DETAILS = gql`
  query GetPostById($getPostByIdId: ID) {
    getPostById(id: $getPostByIdId) {
      _id
      authorId
      userDetails {
        username
      }
      content
      imgUrl
      likes {
        username
      }
      tags
      updatedAt
      createdAt
      comments {
        username
        content
        createdAt
      }
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
      _id
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

const ADD_COMMENT = gql`
  mutation AddComent($content: String, $id: ID) {
    addComent(content: $content, _id: $id) {
      content
      username
      updatedAt
      createdAt
    }
  }
`;

const ADD_LIKE = gql`
  mutation AddLike($id: ID) {
    addLike(_id: $id) {
      username
    }
  }
`;

const FOLLOW = gql`
  mutation FollowUser($followingId: ID) {
    followUser(followingId: $followingId) {
      followingId
      followerId
      updatedAt
      createdAt
    }
  }
`;

const UNFOLLOW = gql`
  mutation UnfollowUser($followingId: ID) {
    unfollowUser(followingId: $followingId) {
      message
    }
  }
`;

export default function Details({ route }) {
  // Ekstrak parameter dengan nilai default
  const { postId, currentUsername, followings = [] } = route.params || {};

  // Navigasi
  const navigation = useNavigation();

  // State
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [localFollowings, setLocalFollowings] = useState(followings || []);
  const [showEmptyCommentModal, setShowEmptyCommentModal] = useState(false);

  // Mutasi
  const [addComment] = useMutation(ADD_COMMENT);
  const [likePost] = useMutation(ADD_LIKE);
  const [follow] = useMutation(FOLLOW);
  const [unfollow] = useMutation(UNFOLLOW);

  // Query
  const { loading, error, data, refetch } = useQuery(GET_DETAILS, {
    variables: {
      getPostByIdId: postId,
    },
    skip: !postId, // Lewati jika tidak ada postId
    fetchPolicy: "cache-and-network", // Gunakan cache dulu, tapi selalu fetch dari network juga
    notifyOnNetworkStatusChange: true, // Notifikasi saat status network berubah
  });

  // Ambil userId saat komponen dimuat
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const id = await getSecure("userId");
        console.log("Fetched userId:", id);
        setUserId(id);
      } catch (error) {
        console.log("Error fetching userId:", error);
      }
    };
    fetchUserId();
  }, []);

  // Auto-refetch saat screen mendapat focus (untuk handle app restart)
  useFocusEffect(
    useCallback(() => {
      if (postId && refetch) {
        console.log("Screen focused, refetching data...");
        refetch();
      }
    }, [postId, refetch])
  );

  // Fungsi pembantu untuk memformat waktu
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

  // Periksa apakah pengguna saat ini mengikuti penulis post
  const isFollowing = () => {
    if (
      !localFollowings ||
      !Array.isArray(localFollowings) ||
      !data?.getPostById?.userDetails?.username
    ) {
      return false;
    }
    return localFollowings.some(
      (following) =>
        following?.username === data.getPostById.userDetails.username
    );
  };

  // Periksa apakah post ditulis oleh pengguna saat ini
  const isOwnPost = () => {
    return currentUsername === data?.getPostById?.userDetails?.username;
  };

  // Periksa apakah post sudah di-like oleh pengguna saat ini
  const isLikedByCurrentUser = () => {
    if (!currentUsername || !data?.getPostById?.likes) return false;
    return data.getPostById.likes.some(
      (like) => like.username === currentUsername
    );
  };

  // Tangani like/unlike post
  const handleLike = async () => {
    if (!userId) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "User not authenticated",
      });
      return;
    }

    if (isLikeLoading) return; // Mencegah klik berulang

    try {
      setIsLikeLoading(true);
      console.log("Liking post...");

      const result = await likePost({
        variables: { id: postId },
        refetchQueries: [
          {
            query: GET_DETAILS,
            variables: {
              getPostByIdId: postId,
            },
          },
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
        text2: isLikedByCurrentUser() ? "Post unliked" : "Post liked",
      });
    } catch (error) {
      console.log("Error liking post:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to like post",
      });
    } finally {
      setIsLikeLoading(false);
    }
  };

  // Tangani pengiriman komentar
  const handleComment = async () => {
    if (!content.trim()) {
      setShowEmptyCommentModal(true);
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("Adding comment...");

      const result = await addComment({
        variables: {
          content: content.trim(),
          id: postId,
        },
        refetchQueries: [
          {
            query: GET_DETAILS,
            variables: {
              getPostByIdId: postId,
            },
          },
        ],
      });

      console.log("Comment added successfully:", result.data.addComent);
      setContent(""); // Kosongkan input setelah komentar berhasil

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Comment added successfully",
      });
    } catch (error) {
      console.log("Comment failed:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to add comment",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tangani toggle follow/unfollow
  const handleFollowToggle = async () => {
    if (!userId) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "User not authenticated",
      });
      return;
    }

    if (isFollowLoading) return; // Mencegah klik berulang

    try {
      setIsFollowLoading(true);
      const isCurrentlyFollowing = isFollowing();
      const targetUsername = data.getPostById.userDetails.username;

      if (isCurrentlyFollowing) {
        console.log("Unfollowing user...");
        const result = await unfollow({
          variables: {
            followingId: data.getPostById.authorId,
          },
          refetchQueries: [
            {
              query: GET_POSTS,
              variables: {
                usersByIdId: userId,
              },
            },
          ],
        });
        console.log("Unfollow successful:", result.data.unfollowUser);

        // Perbarui state lokal untuk menghapus pengguna dari following
        setLocalFollowings((prev) =>
          prev.filter((following) => following.username !== targetUsername)
        );

        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Unfollowed successfully",
        });
      } else {
        console.log("Following user...");
        const result = await follow({
          variables: {
            followingId: data.getPostById.authorId,
          },
          refetchQueries: [
            {
              query: GET_POSTS,
              variables: {
                usersByIdId: userId,
              },
            },
          ],
        });
        console.log("Follow successful:", result.data.followUser);

        // Perbarui state lokal untuk menambahkan pengguna ke following
        setLocalFollowings((prev) => [...prev, { username: targetUsername }]);

        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Followed successfully",
        });
      }

      // Hapus navigation.goBack() - tetap di layar saat ini
    } catch (error) {
      const action = isFollowing() ? "Unfollow" : "Follow";
      console.log(`${action} failed:`, error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || `Failed to ${action.toLowerCase()}`,
      });
    } finally {
      setIsFollowLoading(false);
    }
  };

  // State loading
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1d9bf0" />
        <Text style={styles.loadingText}>Loading post...</Text>
      </View>
    );
  }

  // State error
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading post</Text>
        <Text style={styles.errorMessage}>{error.message}</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  // State tidak ada data
  if (!data?.getPostById) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Post not found</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const post = data.getPostById;

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />

          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Thread</Text>
            </View>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Post Author Info */}
            <View style={styles.postHeader}>
              <View style={styles.profilePicture}>
                <Text style={styles.profileInitial}>
                  {post.userDetails?.username?.charAt(0)?.toUpperCase() || "?"}
                </Text>
              </View>
              <View style={styles.authorInfo}>
                <Text style={styles.username}>
                  {post.userDetails?.username || "Unknown"}
                </Text>
                <Text style={styles.timestamp}>
                  {formatCreatedAt(post.createdAt)}
                </Text>
              </View>
              {!isOwnPost() && (
                <Pressable
                  style={[
                    styles.followButton,
                    isFollowing() && styles.followingButton,
                    isFollowLoading && styles.disabledButton,
                  ]}
                  onPress={handleFollowToggle}
                  disabled={isFollowLoading}
                >
                  {isFollowLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={isFollowing() ? "white" : "black"}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.followButtonText,
                        isFollowing() && styles.followingButtonText,
                      ]}
                    >
                      {isFollowing() ? "Following" : "Follow"}
                    </Text>
                  )}
                </Pressable>
              )}
            </View>

            {/* Post Content */}
            <View style={styles.postContent}>
              <Text style={styles.postText}>{post.content}</Text>
              {post.imgUrl && (
                <Image
                  source={{ uri: post.imgUrl }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              )}
              {post.tags && post.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {post.tags.map((tag, index) => (
                    <Text key={index} style={styles.tag}>
                      #{tag}
                    </Text>
                  ))}
                </View>
              )}
            </View>

            {/* Engagement Bar */}
            <View style={styles.engagementBar}>
              <Pressable
                style={styles.engagementItem}
                onPress={handleLike}
                disabled={isLikeLoading}
              >
                {isLikeLoading ? (
                  <ActivityIndicator size="small" color="#f91880" />
                ) : (
                  <Ionicons
                    name={isLikedByCurrentUser() ? "heart" : "heart-outline"}
                    size={24}
                    color={isLikedByCurrentUser() ? "#f91880" : "white"}
                  />
                )}
                <Text style={styles.engagementCount}>
                  {post.likes?.length || 0}
                </Text>
              </Pressable>
              <Pressable style={styles.engagementItem}>
                <Ionicons name="chatbubble-outline" size={24} color="white" />
                <Text style={styles.engagementCount}>
                  {post.comments?.length || 0}
                </Text>
              </Pressable>
              <Pressable style={styles.engagementItem}>
                <Feather name="repeat" size={24} color="white" />
                <Text style={styles.engagementCount}>0</Text>
              </Pressable>
              <Pressable style={styles.engagementItem}>
                <Feather name="send" size={24} color="white" />
              </Pressable>
            </View>

            {/* Comments Section */}
            <View style={styles.commentsSection}>
              {post.comments && post.comments.length > 0 ? (
                post.comments.map((comment, index) => (
                  <View key={index} style={styles.comment}>
                    <View style={styles.commentProfilePicture}>
                      <Text style={styles.commentProfileInitial}>
                        {comment.username?.charAt(0)?.toUpperCase() || "?"}
                      </Text>
                    </View>
                    <View style={styles.commentContent}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentUsername}>
                          {comment.username || "Unknown"}
                        </Text>
                        <Text style={styles.commentTime}>
                          {formatCreatedAt(comment.createdAt)}
                        </Text>
                      </View>
                      <Text style={styles.commentText}>{comment.content}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noComments}>
                  No comments yet. Be the first to comment!
                </Text>
              )}
            </View>
          </ScrollView>

          {/* Reply Input */}
          <View style={styles.replyInput}>
            <View style={styles.replyProfilePicture}>
              <Text style={styles.replyProfileInitial}>
                {currentUsername?.charAt(0)?.toUpperCase() || "?"}
              </Text>
            </View>
            <View style={styles.replyContent}>
              <Text style={styles.replyUsername}>
                {currentUsername || "Unknown"}
              </Text>
              <TextInput
                style={styles.replyTextInput}
                placeholder={`Reply to ${
                  post.userDetails?.username || "this post"
                }...`}
                placeholderTextColor="#888"
                value={content}
                onChangeText={setContent}
                multiline
                editable={!isSubmitting}
              />
            </View>
            <View style={styles.replyActions}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#1d9bf0" />
              ) : (
                <Pressable onPress={handleComment} disabled={!content.trim()}>
                  <Feather
                    name="send"
                    size={24}
                    color={content.trim() ? "#1d9bf0" : "#888"}
                  />
                </Pressable>
              )}
            </View>
          </View>

          {/* Modal untuk Empty Comment */}
          <Modal
            isVisible={showEmptyCommentModal}
            backdropColor="rgba(0, 0, 0, 0.5)"
            animationIn="fadeIn"
            animationOut="fadeOut"
            onBackdropPress={() => setShowEmptyCommentModal(false)}
            onBackButtonPress={() => setShowEmptyCommentModal(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Empty Comment</Text>
                <Text style={styles.modalMessage}>
                  Please enter a comment before submitting.
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={() => setShowEmptyCommentModal(false)}
                  >
                    <Text style={styles.confirmButtonText}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    padding: 20,
  },
  loadingText: {
    color: "#888",
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  errorMessage: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#1d9bf0",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#333",
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1d9bf0",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitial: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  authorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  timestamp: {
    color: "#888",
    fontSize: 12,
  },
  followButton: {
    backgroundColor: "white",
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
    alignItems: "center",
  },
  followingButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#888",
  },
  disabledButton: {
    opacity: 0.6,
  },
  followButtonText: {
    color: "black",
    fontWeight: "600",
  },
  followingButtonText: {
    color: "white",
  },
  postContent: {
    paddingHorizontal: 16,
  },
  postText: {
    color: "white",
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    color: "#1d9bf0",
    fontSize: 14,
  },
  engagementBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: "#333",
    borderBottomWidth: 0.5,
    borderBottomColor: "#333",
  },
  engagementItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 32,
    gap: 6,
  },
  engagementCount: {
    color: "white",
    fontSize: 14,
  },
  commentsSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  noComments: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    marginVertical: 20,
  },
  comment: {
    flexDirection: "row",
    marginBottom: 20,
  },
  commentProfilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1d9bf0",
    alignItems: "center",
    justifyContent: "center",
  },
  commentProfileInitial: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  commentUsername: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  commentTime: {
    color: "#888",
    fontSize: 14,
    marginLeft: 8,
  },
  commentText: {
    color: "white",
    fontSize: 15,
    lineHeight: 20,
  },
  replyInput: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: "#333",
    backgroundColor: "#000",
    gap: 10,
  },
  replyProfilePicture: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1d9bf0",
    alignItems: "center",
    justifyContent: "center",
  },
  replyProfileInitial: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
  replyContent: {
    flex: 1,
  },
  replyUsername: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 3,
  },
  replyTextInput: {
    color: "white",
    fontSize: 15,
    minHeight: 36,
    maxHeight: 90,
    textAlignVertical: "top",
    padding: 0,
  },
  replyActions: {
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 6,
  },
  // Modal styles
  modalContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: 15,
    padding: 25,
    width: "85%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 15,
  },
  modalButton: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: "#1d9bf0",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
