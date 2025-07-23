import { useNavigation } from "@react-navigation/native";
import {
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { gql, useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { getSecure } from "../helpers/secureStore";
import { ActivityIndicator } from "react-native";
import Toast from "react-native-toast-message";
import Modal from "react-native-modal";

const GET_USER = gql`
  query UsersByName($nameUsername: String) {
    usersByName(nameUsername: $nameUsername) {
      _id
      name
      username
      email
      followers {
        username
      }
      followings {
        username
      }
    }
  }
`;

const GET_CURRENT_USER = gql`
  query UsersById($usersByIdId: ID) {
    usersById(id: $usersByIdId) {
      _id
      username
      followings {
        username
      }
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

export default function Search() {
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [userId, setUserId] = useState(null);
  const [currentUsername, setCurrentUsername] = useState("");
  const [followingUsers, setFollowingUsers] = useState([]);
  const [followingLoading, setFollowingLoading] = useState({});
  const [hasSearched, setHasSearched] = useState(false);
  const [isNoResultsModalVisible, setIsNoResultsModalVisible] = useState(false);
  const navigation = useNavigation();

  const [getUsersByName, { loading, error, data }] = useLazyQuery(GET_USER);
  const [follow] = useMutation(FOLLOW);
  const [unfollow] = useMutation(UNFOLLOW);

  // Dapatkan data pengguna saat ini
  const { data: currentUserData } = useQuery(GET_CURRENT_USER, {
    variables: { usersByIdId: userId },
    skip: !userId,
  });

  // Ambil userId dan username saat komponen dimuat
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const id = await getSecure("userId");
        const username = await getSecure("username");
        setUserId(id);
        setCurrentUsername(username || "");
      } catch (error) {
        console.log("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, []);

  // Perbarui daftar pengguna yang diikuti ketika data pengguna saat ini berubah
  useEffect(() => {
    if (currentUserData?.usersById?.followings) {
      setFollowingUsers(currentUserData.usersById.followings);
    }
    // Juga perbarui currentUsername dari data GraphQL jika tidak diatur dari secure storage
    if (currentUserData?.usersById?.username && !currentUsername) {
      setCurrentUsername(currentUserData.usersById.username);
    }
  }, [currentUserData, currentUsername]);

  // Tangani pencarian ketika searchText berubah
  useEffect(() => {
    if (searchText.trim().length > 0) {
      // Clear previous results immediately when starting new search
      setSearchResults([]);
      setHasSearched(false);
      // Debounce pencarian untuk menghindari terlalu banyak panggilan API
      const timeoutId = setTimeout(() => {
        getUsersByName({
          variables: { nameUsername: searchText.trim() },
        });
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setHasSearched(false);
    }
  }, [searchText, getUsersByName]);

  // Perbarui hasil pencarian ketika data berubah
  useEffect(() => {
    if (data) {
      if (data.usersByName && Array.isArray(data.usersByName)) {
        setSearchResults(data.usersByName);
        if (data.usersByName.length === 0 && searchText.trim().length > 0) {
          setIsNoResultsModalVisible(true);
        }
      } else {
        setSearchResults([]);
        if (searchText.trim().length > 0) {
          setIsNoResultsModalVisible(true);
        }
      }
      setHasSearched(true);
    }
  }, [data, searchText]);

  // Handle error case
  useEffect(() => {
    if (error) {
      setSearchResults([]);
      setHasSearched(true);
    }
  }, [error]);

  // Periksa apakah pengguna saat ini mengikuti pengguna tertentu
  const isFollowing = (targetUsername) => {
    if (!followingUsers || !Array.isArray(followingUsers)) {
      return false;
    }
    return followingUsers.some(
      (following) => following?.username === targetUsername
    );
  };

  // Periksa apakah pengguna adalah pengguna saat ini (tidak bisa mengikuti diri sendiri)
  const isOwnProfile = (targetUsername) => {
    return currentUsername === targetUsername;
  };

  // Tangani toggle follow/unfollow
  const handleFollowToggle = async (targetUser) => {
    if (!userId) {
      Toast.show({
        type: "error",
        text1: "Authentication Error",
        text2: "User not authenticated",
      });
      return;
    }

    if (followingLoading[targetUser._id]) return; // Prevent multiple clicks

    try {
      setFollowingLoading((prev) => ({ ...prev, [targetUser._id]: true }));
      const isCurrentlyFollowing = isFollowing(targetUser.username);

      if (isCurrentlyFollowing) {
        console.log("Unfollowing user...");
        const result = await unfollow({
          variables: {
            followingId: targetUser._id,
          },
          refetchQueries: [
            {
              query: GET_CURRENT_USER,
              variables: {
                usersByIdId: userId,
              },
            },
          ],
        });
        console.log("Unfollow successful:", result.data.unfollowUser);

        // Perbarui state lokal
        setFollowingUsers((prev) =>
          prev.filter((following) => following.username !== targetUser.username)
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
            followingId: targetUser._id,
          },
          refetchQueries: [
            {
              query: GET_CURRENT_USER,
              variables: {
                usersByIdId: userId,
              },
            },
          ],
        });
        console.log("Follow successful:", result.data.followUser);

        // Perbarui state lokal
        setFollowingUsers((prev) => [
          ...prev,
          { username: targetUser.username },
        ]);

        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Followed successfully",
        });
      }
    } catch (error) {
      const action = isFollowing(targetUser.username) ? "Unfollow" : "Follow";
      console.log(`${action} failed:`, error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || `Failed to ${action.toLowerCase()}`,
      });
    } finally {
      setFollowingLoading((prev) => ({ ...prev, [targetUser._id]: false }));
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      {/* Bar Pencarian */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#666"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* Daftar Pengguna */}
      <ScrollView style={styles.userList}>
        {searchText.trim().length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Enter a name or username to search for users
            </Text>
          </View>
        ) : loading || !hasSearched ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#1d9bf0" />
            <Text style={styles.emptyStateText}>Searching...</Text>
          </View>
        ) : searchResults.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No users found</Text>
          </View>
        ) : (
          searchResults.map((user) => (
            <View key={user._id} style={styles.userItem}>
              <Pressable
                style={styles.userInfo}
                onPress={() =>
                  navigation.navigate("Profile", {
                    id: user._id,
                  })
                }
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userDetails}>
                  <View style={styles.usernameRow}>
                    <Text style={styles.username}>{user.username}</Text>
                  </View>
                  <Text style={styles.displayName}>{user.name}</Text>
                  <Text style={styles.followers}>
                    {user.followers && Array.isArray(user.followers)
                      ? user.followers.length
                      : 0}{" "}
                    followers •{" "}
                    {user.followings && Array.isArray(user.followings)
                      ? user.followings.length
                      : 0}{" "}
                    following
                  </Text>
                </View>
              </Pressable>
              {!isOwnProfile(user.username) && (
                <TouchableOpacity
                  style={[
                    styles.followButton,
                    isFollowing(user.username) && styles.followingButton,
                    followingLoading[user._id] && styles.disabledButton,
                  ]}
                  onPress={() => handleFollowToggle(user)}
                  disabled={followingLoading[user._id]}
                >
                  {followingLoading[user._id] ? (
                    <ActivityIndicator
                      size="small"
                      color={isFollowing(user.username) ? "white" : "black"}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.followButtonText,
                        isFollowing(user.username) &&
                          styles.followingButtonText,
                      ]}
                    >
                      {isFollowing(user.username) ? "Following" : "Follow"}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        isVisible={isNoResultsModalVisible}
        onBackdropPress={() => setIsNoResultsModalVisible(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>No Results Found</Text>
          <Text style={styles.modalText}>
            No users found for "{searchText}". Try searching with a different
            name or username.
          </Text>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setIsNoResultsModalVisible(false)}
          >
            <Text style={styles.modalButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    borderBottomWidth: 0.5,
    borderBottomColor: "#333",
  },
  backButton: {
    fontSize: 28,
    color: "#fff",
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 20,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
    color: "#666",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#fff",
  },
  userList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1d9bf0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  userDetails: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginRight: 5,
  },
  verifiedBadge: {
    fontSize: 16,
    color: "#1DA1F2",
  },
  displayName: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  followers: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  followButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 10,
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
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  followingButtonText: {
    color: "#fff",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#ff6b6b",
    textAlign: "center",
  },
  modal: {
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  modalText: {
    color: "#ccc",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 5,
  },
  modalButtonText: {
    color: "#000",
    fontWeight: "600",
  },
});
