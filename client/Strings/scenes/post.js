import { useNavigation } from "@react-navigation/native";
import {
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { gql, useMutation, useQuery } from "@apollo/client";
import { getSecure } from "../helpers/secureStore";
import { useEffect, useState } from "react";
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
        username
      }
      followings {
        username
      }
    }
  }
`;

const GET_POSTS = gql`
  query UsersById($usersByIdId: ID) {
    usersById(id: $usersByIdId) {
      username
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

const POST = gql`
  mutation CreatePost($content: String, $tags: [String], $imgUrl: String) {
    createPost(content: $content, tags: $tags, imgUrl: $imgUrl) {
      authorId
      content
      imgUrl
      tags
      comments {
        content
        createdAt
        updatedAt
        username
      }
      likes {
        createdAt
        updatedAt
        username
      }
      createdAt
      updatedAt
    }
  }
`;

export default function Post() {
  const { navigate } = useNavigation();
  const [userId, setUserId] = useState(null);
  const [content, setContent] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [tags, setTags] = useState("");
  const [post] = useMutation(POST);

  const generateImageUrl = (text) => {
    if (!text || text.trim() === "") return "";

    const encodedText = encodeURIComponent(text.trim());
    return `https://image.pollinations.ai/prompt/${encodedText}?height=576&nologo=true&model=flux`;
  };

  const handlePost = async () => {
    try {
      console.log("Posting content...");

      // Buat URL gambar hanya jika imgUrl kosong dan content ada
      const finalImgUrl =
        imgUrl.trim() === "" && content.trim() !== ""
          ? generateImageUrl(content)
          : imgUrl;

      const result = await post({
        variables: {
          content: content,
          tags: tags ? tags.split(", ") : [],
          imgUrl: finalImgUrl,
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
      console.log(result.data.createPost, "Post created successfully");
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Post created successfully",
      });
      navigate("Home");
    } catch (error) {
      console.log(error, "Post failed");
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to create post",
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

  const { loading, error, data } = useQuery(GET_PROFILE, {
    variables: {
      usersByIdId: userId,
    },
    skip: !userId, // Lewati query jika userId tidak tersedia
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data?.usersById) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Error loading profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigate("Home")}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>New strings</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* User Section */}
      <View style={styles.userSection}>
        <View style={styles.profilePicture}>
          <Text style={styles.profileInitial}>
            {data.usersById.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{data.usersById.username}</Text>
          <Text style={styles.addTopic}>Add a new topic</Text>
        </View>
      </View>

      {/* Input Section */}
      <View style={styles.inputSection}>
        <TextInput
          placeholder="What's new?"
          placeholderTextColor="#666"
          style={styles.textInput}
          value={content}
          onChangeText={setContent}
          multiline
        />

        <TextInput
          placeholder="Add image URL (leave empty to auto-generate)"
          placeholderTextColor="#666"
          value={imgUrl}
          onChangeText={setImgUrl}
          style={styles.imageInput}
        />

        <TextInput
          placeholder="Add hashtags (e.g., #comedy #music)"
          placeholderTextColor="#666"
          style={styles.hashtagInput}
          value={tags}
          onChangeText={setTags}
          multiline
        />
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <Text style={styles.bottomText}>Your followers can reply & quote</Text>
        <Pressable style={styles.postButton} onPress={handlePost}>
          <Text style={styles.postButtonText}>Post</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#333",
  },
  headerCenter: {
    flex: 1,
    marginLeft: 20,
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
  },
  placeholder: {
    width: 30,
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
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
  profileInitial: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  addTopic: {
    color: "#666",
    fontSize: 14,
    marginTop: 2,
  },
  inputSection: {
    flex: 1,
    marginLeft: 52,
    paddingHorizontal: 16,
  },
  textInput: {
    color: "#fff",
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  imageInput: {
    color: "#fff",
    fontSize: 16,
    minHeight: 40,
    textAlignVertical: "top",
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 16,
  },
  hashtagInput: {
    color: "#1d9bf0",
    fontSize: 16,
    minHeight: 40,
    textAlignVertical: "top",
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 16,
  },
  bottomSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  bottomText: {
    color: "#666",
    fontSize: 14,
  },
  postButton: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  postButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
