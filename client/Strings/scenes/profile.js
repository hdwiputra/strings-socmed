import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  StatusBar,
} from "react-native";

import { gql, useMutation, useQuery } from "@apollo/client";
import { getSecure, deleteSecure } from "../helpers/secureStore";
import { useEffect, useState, useContext } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../contexts/AuthContext";
import Toast from "react-native-toast-message";
import Modal from "react-native-modal";

const GET_PROFILE = gql`
  query UsersById($usersByIdId: ID) {
    usersById(id: $usersByIdId) {
      _id
      name
      username
      email
      followers {
        _id
        username
      }
      followings {
        _id
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

export default function Profile({ route }) {
  const [activeTab, setActiveTab] = useState("followers");
  const [userId, setUserId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUsername, setCurrentUsername] = useState("");
  const [followingUsers, setFollowingUsers] = useState([]);
  const [followLoading, setFollowLoading] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [follow] = useMutation(FOLLOW);
  const [unfollow] = useMutation(UNFOLLOW);
  const navigation = useNavigation();
  const { setIsSignedIn } = useContext(AuthContext);
  const id = route?.params?.id; // ID dari parameter navigasi (untuk profil pengguna lain)

  useEffect(() => {
    const fetchUserId = async () => {
      if (id) {
        // Jika id diberikan dari parameter route, gunakan itu (melihat profil pengguna lain)
        setUserId(id);
        // Juga dapatkan ID pengguna saat ini untuk perbandingan dan status follow
        const storedId = await getSecure("userId");
        const storedUsername = await getSecure("username");
        setCurrentUserId(storedId);
        setCurrentUsername(storedUsername || "");
      } else {
        // Jika tidak, dapatkan ID pengguna saat ini dari secure store (profil sendiri)
        const storedId = await getSecure("userId");
        const storedUsername = await getSecure("username");
        console.log(storedId, "userId");
        setUserId(storedId);
        setCurrentUserId(storedId);
        setCurrentUsername(storedUsername || "");
      }
    };
    fetchUserId();
  }, [id]);

  const handleFollow = async () => {
    if (!currentUserId) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "User not authenticated",
      });
      return;
    }

    if (followLoading) return; // Mencegah klik berulang

    try {
      setFollowLoading(true);
      const isCurrentlyFollowing = isFollowing(data.usersById.username);

      if (isCurrentlyFollowing) {
        console.log("Unfollowing user...");
        const result = await unfollow({
          variables: {
            followingId: data.usersById._id,
          },
          refetchQueries: [
            {
              query: GET_CURRENT_USER,
              variables: {
                usersByIdId: currentUserId,
              },
            },
            {
              query: GET_PROFILE,
              variables: {
                usersByIdId: userId,
              },
            },
          ],
        });
        console.log("Unfollow successful:", result.data.unfollowUser);

        // Perbarui state lokal
        setFollowingUsers((prev) =>
          prev.filter(
            (following) => following.username !== data.usersById.username
          )
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
            followingId: data.usersById._id,
          },
          refetchQueries: [
            {
              query: GET_CURRENT_USER,
              variables: {
                usersByIdId: currentUserId,
              },
            },
            {
              query: GET_PROFILE,
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
          { username: data.usersById.username },
        ]);

        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Followed successfully",
        });
      }
    } catch (error) {
      const action = isFollowing(data.usersById.username)
        ? "Unfollow"
        : "Follow";
      console.log(`${action} failed:`, error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || `Failed to ${action.toLowerCase()}`,
      });
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLogout = async () => {
    setShowLogoutAlert(true);
  };

  const confirmLogout = async () => {
    try {
      setShowLogoutAlert(false);
      setIsSignedIn(false);
      await deleteSecure("access_token");
      await deleteSecure("userId");
      await deleteSecure("username");

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Logged out successfully",
      });
    } catch (logoutError) {
      console.log("Logout process failed:", logoutError);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to logout completely",
      });
    }
  };

  const { loading, error, data } = useQuery(GET_PROFILE, {
    variables: {
      usersByIdId: userId,
    },
    skip: !userId, // Lewati query jika userId null/undefined
  });

  // Dapatkan data pengguna saat ini untuk status follow
  const { data: currentUserData } = useQuery(GET_CURRENT_USER, {
    variables: { usersByIdId: currentUserId },
    skip: !currentUserId || !id, // Lewati jika tidak ada ID pengguna saat ini atau melihat profil sendiri
  });

  // Perbarui pengguna yang diikuti ketika data pengguna saat ini berubah
  useEffect(() => {
    if (currentUserData?.usersById?.followings) {
      setFollowingUsers(currentUserData.usersById.followings);
    }
  }, [currentUserData]);

  // Periksa apakah pengguna saat ini mengikuti pengguna profil
  const isFollowing = (targetUsername) => {
    if (!followingUsers || !Array.isArray(followingUsers)) {
      return false;
    }
    return followingUsers.some(
      (following) => following?.username === targetUsername
    );
  };

  console.log({ loading, error, data });

  // Tampilkan loading jika userId sedang diambil atau query sedang loading
  if (!userId || loading) {
    const LoadingContent = (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#000",
        }}
      >
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: "#fff", marginTop: 10 }}>Loading...</Text>
      </View>
    );

    // Jika diakses dari bottom tab (tidak ada id), jangan gunakan SafeAreaView
    if (!id) {
      return LoadingContent;
    }

    // Jika diakses dari navigasi (dengan id), gunakan SafeAreaView
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        {LoadingContent}
      </SafeAreaView>
    );
  }

  if (error) {
    const ErrorContent = (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#000",
        }}
      >
        <Text style={{ color: "#fff" }}>{error.message}</Text>
      </View>
    );

    // Jika diakses dari bottom tab (tidak ada id), jangan gunakan SafeAreaView
    if (!id) {
      return ErrorContent;
    }

    // Jika diakses dari navigasi (dengan id), gunakan SafeAreaView
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        {ErrorContent}
      </SafeAreaView>
    );
  }

  // Periksa apakah data ada sebelum melanjutkan
  if (!data || !data.usersById) {
    const NoDataContent = (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#000",
        }}
      >
        <Text style={{ color: "#fff" }}>No user data found</Text>
      </View>
    );

    // Jika diakses dari bottom tab (tidak ada id), jangan gunakan SafeAreaView
    if (!id) {
      return NoDataContent;
    }

    // Jika diakses dari navigasi (dengan id), gunakan SafeAreaView
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        {NoDataContent}
      </SafeAreaView>
    );
  }

  // Komponen konten utama
  const MainContent = () => (
    <ScrollView
      style={id ? styles.content : styles.contentNoHeader}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Profil */}
      <View style={styles.profileHeader}>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{data.usersById.name}</Text>
          <Text style={styles.username}>@{data.usersById.username}</Text>
          <Text style={styles.email}>{data.usersById.email}</Text>
        </View>

        <View style={styles.rightSection}>
          {/* Foto Profil dengan Inisial */}
          <View style={styles.profilePicture}>
            <Text style={styles.initials}>
              {data.usersById.name[0].toUpperCase()}
            </Text>
          </View>

          {/* Tombol Logout - hanya tampilkan ketika melihat profil sendiri */}
          {currentUserId === data.usersById._id && (
            <Pressable style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Statistik dan Tombol Follow */}
      <View style={styles.statsContainer}>
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {data.usersById.followers.length}
            </Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {data.usersById.followings.length}
            </Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        {/* Tombol Follow - hanya tampilkan ketika melihat profil pengguna lain */}
        {currentUserId !== data.usersById._id && (
          <TouchableOpacity
            style={[
              styles.followButton,
              isFollowing(data.usersById.username) && styles.followingButton,
              followLoading && styles.disabledButton,
            ]}
            onPress={handleFollow}
            disabled={followLoading}
          >
            {followLoading ? (
              <ActivityIndicator
                size="small"
                color={isFollowing(data.usersById.username) ? "white" : "black"}
              />
            ) : (
              <Text
                style={[
                  styles.followButtonText,
                  isFollowing(data.usersById.username) &&
                    styles.followingButtonText,
                ]}
              >
                {isFollowing(data.usersById.username) ? "Following" : "Follow"}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Navigasi Tab */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "followers" && styles.activeTab]}
          onPress={() => setActiveTab("followers")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "followers" && styles.activeTabText,
            ]}
          >
            Followers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "following" && styles.activeTab]}
          onPress={() => setActiveTab("following")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "following" && styles.activeTabText,
            ]}
          >
            Following
          </Text>
        </TouchableOpacity>
      </View>

      {/* Konten Tab */}
      <View style={styles.tabContent}>
        {activeTab === "followers"
          ? data.usersById.followers.map((follower, index) => (
              <Pressable
                key={index}
                style={styles.userItem}
                onPress={() =>
                  navigation.navigate("Profile", {
                    id: follower._id,
                  })
                }
              >
                <View style={styles.userAvatar}>
                  <Text style={styles.avatarText}>
                    {follower.username[0].toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.userUsername}>@{follower.username}</Text>
              </Pressable>
            ))
          : data.usersById.followings.map((following, index) => (
              <Pressable
                key={index}
                style={styles.userItem}
                onPress={() =>
                  navigation.navigate("Profile", {
                    id: following._id,
                  })
                }
              >
                <View style={styles.userAvatar}>
                  <Text style={styles.avatarText}>
                    {following.username[0].toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.userUsername}>@{following.username}</Text>
              </Pressable>
            ))}
      </View>
    </ScrollView>
  );

  // Jika diakses dari bottom tab (tidak ada id), tidak perlu SafeAreaView karena sudah ada di BottomTab
  if (!id) {
    return (
      <View style={styles.containerNoSafeArea}>
        <MainContent />
        <Modal
          isVisible={showLogoutAlert}
          backdropColor="rgba(0, 0, 0, 0.5)"
          animationIn="fadeIn"
          animationOut="fadeOut"
          onBackdropPress={() => setShowLogoutAlert(false)}
          onBackButtonPress={() => setShowLogoutAlert(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Logout</Text>
              <Text style={styles.modalMessage}>
                Are you sure you want to logout?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowLogoutAlert(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={confirmLogout}
                >
                  <Text style={styles.confirmButtonText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Jika diakses dari navigasi (dengan id), gunakan SafeAreaView dan header khusus
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header - hanya tampilkan ketika melihat profil pengguna lain */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
      </View>

      <MainContent />

      <Modal
        isVisible={showLogoutAlert}
        backdropColor="rgba(0, 0, 0, 0.5)"
        animationIn="fadeIn"
        animationOut="fadeOut"
        onBackdropPress={() => setShowLogoutAlert(false)}
        onBackButtonPress={() => setShowLogoutAlert(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to logout?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowLogoutAlert(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmLogout}
              >
                <Text style={styles.confirmButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  containerNoSafeArea: {
    flex: 1,
    backgroundColor: "#000",
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
    padding: 20,
  },
  contentNoHeader: {
    flex: 1,
    padding: 20,
    paddingTop: 20, // No extra padding needed when accessed from bottom tab
  },
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  profileInfo: {
    flex: 1,
  },
  rightSection: {
    alignItems: "center",
    gap: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#888",
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1d9bf0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  initials: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  logoutText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  stats: {
    flexDirection: "row",
    gap: 40,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  followButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
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
    color: "#000",
    fontSize: 14,
    fontWeight: "600",
  },
  followingButtonText: {
    color: "#fff",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#fff",
  },
  tabText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "bold",
  },
  tabContent: {
    // dihapus maxHeight untuk konten yang dapat di-scroll
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1d9bf0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  userUsername: {
    fontSize: 16,
    color: "#fff",
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
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#666",
  },
  confirmButton: {
    backgroundColor: "#1d9bf0",
  },
  cancelButtonText: {
    color: "#ccc",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
