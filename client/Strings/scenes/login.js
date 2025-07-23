import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { AuthContext } from "../contexts/AuthContext";
import { gql, useMutation } from "@apollo/client";
import { saveSecure } from "../helpers/secureStore";
import { useContext, useState } from "react";
import Toast from "react-native-toast-message";
import Modal from "react-native-modal";

const LOGIN = gql`
  mutation Login($usernameEmail: String!, $password: String!) {
    login(usernameEmail: $usernameEmail, password: $password) {
      access_token
      message
      userId
    }
  }
`;

export default function Login() {
  const { navigate } = useNavigation();
  const [usernameEmail, setUsernameEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isValidationModalVisible, setIsValidationModalVisible] =
    useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { setIsSignedIn } = useContext(AuthContext);
  const [login] = useMutation(LOGIN);

  const handleLogin = async () => {
    if (!usernameEmail.trim() || !password.trim()) {
      setErrorMessage(
        error.message ||
          "Please fill in both username/email and password fields"
      );
      setIsValidationModalVisible(true);
      return;
    }

    try {
      console.log("masuk Login");
      const result = await login({
        variables: {
          usernameEmail: usernameEmail,
          password: password,
        },
      });
      const access_token = result.data.login.access_token;
      const userId = result.data.login.userId;
      console.log(result.data.login, "result.data.login");
      await saveSecure("access_token", access_token);
      await saveSecure("userId", userId);
      setIsSignedIn(true);
    } catch (error) {
      console.log(error.message || "Login failed");
      setErrorMessage(
        error.message ||
          "Login failed. Please check your credentials and try again"
      );
      setIsValidationModalVisible(true);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "android" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.formContainer}>
          <Text style={styles.title}>Strings</Text>
          <Text style={styles.subtitle}>Login into your account</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email or Username"
              value={usernameEmail}
              onChangeText={setUsernameEmail}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoCapitalize="none"
              placeholderTextColor="#666"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#666"
              secureTextEntry={true}
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleLogin}>
            <Text style={styles.submitButtonText}>Sign in</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink}>
            <Text style={styles.loginText}>
              Doesn't have an account yet?{" "}
              <Text
                style={styles.loginLinkText}
                onPress={() => navigate("Register")}
              >
                Register
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        isVisible={isValidationModalVisible}
        onBackdropPress={() => setIsValidationModalVisible(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Error</Text>
          <Text style={styles.modalText}>{errorMessage}</Text>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setIsValidationModalVisible(false)}
          >
            <Text style={styles.modalButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  formContainer: {
    width: "85%",
    maxWidth: 400,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#999",
    marginBottom: 40,
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 30,
  },
  input: {
    height: 50,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#fff",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#333",
  },
  submitButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  submitButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  loginLink: {
    marginTop: 10,
  },
  loginText: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
  },
  loginLinkText: {
    color: "#fff",
    fontWeight: "600",
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
