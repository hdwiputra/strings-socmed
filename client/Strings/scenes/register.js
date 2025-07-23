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

import { gql, useMutation } from "@apollo/client";
import { useState } from "react";
import Toast from "react-native-toast-message";
import Modal from "react-native-modal";

const REGISTER = gql`
  mutation CreateUser(
    $name: String
    $username: String
    $email: String
    $password: String
  ) {
    createUser(
      name: $name
      username: $username
      email: $email
      password: $password
    ) {
      name
      username
      email
    }
  }
`;

export default function Register() {
  const { navigate } = useNavigation();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isValidationModalVisible, setIsValidationModalVisible] =
    useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [register] = useMutation(REGISTER);

  const handleRegister = async () => {
    if (!name.trim() || !username.trim() || !email.trim() || !password.trim()) {
      setErrorMessage(
        "Please fill in all fields (name, username, email, and password)"
      );
      setIsValidationModalVisible(true);
      return;
    }

    try {
      console.log("masuk Register");
      const result = await register({
        variables: {
          name: name,
          username: username,
          email: email,
          password: password,
        },
      });
      console.log(result.data.createUser, "result.data.login");
      Toast.show({
        type: "success",
        text1: "Registration Successful",
        text2: "Please login with your new account",
      });
      navigate("Login");
    } catch (error) {
      console.log(error, "error");
      setErrorMessage(
        error.message ||
          "Registration failed. Please check your information and try again"
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
          <Text style={styles.subtitle}>Create your account</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#666"
              value={username}
              onChangeText={setUsername}
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

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleRegister}
          >
            <Text style={styles.submitButtonText}>Sign up</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink}>
            <Text style={styles.loginText}>
              Already have an account?{" "}
              <Text
                style={styles.loginLinkText}
                onPress={() => navigate("Login")}
              >
                Log in
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
