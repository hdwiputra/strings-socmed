import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";

import RootStack from "./navigators/Stack";
import { ApolloProvider } from "@apollo/client";
import client from "./config/apollo";
import AuthProvider from "./contexts/AuthContext";
import Toast from "react-native-toast-message";

// Custom dark theme to prevent white flashing
const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#000000",
    card: "#000000",
    primary: "#ffffff",
    text: "#ffffff",
    border: "#333333",
    notification: "#ff6b6b",
  },
};

export default function App() {
  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <ApolloProvider client={client}>
        <AuthProvider>
          <StatusBar
            style="light"
            backgroundColor="#000000"
            translucent={false}
          />
          <NavigationContainer
            theme={CustomDarkTheme}
            onReady={() => {
              // Prevent any initial flash
            }}
          >
            <RootStack />
          </NavigationContainer>
          <Toast />
        </AuthProvider>
      </ApolloProvider>
    </View>
  );
}
