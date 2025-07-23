import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

export default function AddPost({ user }) {
  const { navigate } = useNavigation();

  const handlePress = () => {
    if (!user || !user.username) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "User data not available",
      });
      return;
    }
    navigate("Post");
  };

  // Handle case where user is not available
  if (!user || !user.username) {
    return (
      <View style={styles.composeSection}>
        <View style={styles.composeContent}>
          <View style={styles.profilePicture}>
            <Text style={styles.profileInitial}>?</Text>
          </View>
          <View style={styles.composeText}>
            <Text style={styles.username}>Loading...</Text>
            <Text style={styles.placeholder}>What's new?</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <Pressable style={styles.composeSection} onPress={handlePress}>
      <View style={styles.composeContent}>
        <View style={styles.profilePicture}>
          <Text style={styles.profileInitial}>
            {user.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.composeText}>
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.placeholder}>What's new?</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = {
  composeSection: {
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#333",
  },
  composeContent: {
    flexDirection: "row",
    alignItems: "center",
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
  composeText: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginRight: 8,
  },
  placeholder: {
    fontSize: 16,
    color: "#71767b",
    marginTop: 2,
  },
};
