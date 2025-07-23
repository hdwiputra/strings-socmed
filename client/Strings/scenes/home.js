import {
  ActivityIndicator,
  FlatList,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PostCard from "../components/PostCard";
import AddPost from "../components/AddPost";
import { gql, useQuery } from "@apollo/client";
import { getSecure } from "../helpers/secureStore";
import { useEffect, useState } from "react";
import Toast from "react-native-toast-message";
import Modal from "react-native-modal";

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

export default function Home() {
  const [userId, setUserId] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const id = await getSecure("userId");
        console.log(id, "userId");
        setUserId(id);
      } catch (error) {
        console.log("Error fetching userId:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to fetch user data",
        });
      }
    };
    fetchUserId();
  }, []);

  const { loading, error, data } = useQuery(GET_POSTS, {
    variables: {
      usersByIdId: userId,
    },
    skip: !userId, // Skip query jika userId belum ada
  });
  console.log({ loading, error, data });

  // Show loading jika userId belum ada atau query sedang loading
  if (!userId || loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1d9bf0" />
          <Text style={styles.loadingText}>
            {!userId ? "Initializing..." : "Loading posts..."}
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Failed to load posts</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setShowErrorModal(true);
              setErrorMessage(error.message);
            }}
          >
            <Text style={styles.retryButtonText}>Show Details</Text>
          </TouchableOpacity>
        </View>

        {/* Error Modal */}
        <Modal
          isVisible={showErrorModal}
          backdropColor="rgba(0, 0, 0, 0.5)"
          animationIn="fadeIn"
          animationOut="fadeOut"
          onBackdropPress={() => setShowErrorModal(false)}
          onBackButtonPress={() => setShowErrorModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Connection Error</Text>
              <Text style={styles.modalMessage}>
                Unable to load posts. Please check your internet connection and
                try again.
              </Text>
              <Text style={styles.modalError}>{errorMessage}</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={() => setShowErrorModal(false)}
                >
                  <Text style={styles.confirmButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Jika tidak ada data atau data tidak lengkap
  if (!data || !data.usersById || !data.getPosts) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>No data available</Text>
          <Text style={styles.errorMessage}>
            Unable to load posts data. Please try again.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AddPost user={data.usersById} />
      <FlatList
        data={data.getPosts}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            currentUsername={data.usersById?.username}
            followings={data.usersById?.followings}
          />
        )}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    textAlign: "center",
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
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 0,
    color: "#fff",
    textAlign: "center",
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#333",
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
    marginBottom: 15,
    lineHeight: 22,
  },
  modalError: {
    fontSize: 14,
    color: "#f91880",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 20,
    fontFamily: "monospace",
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
};
