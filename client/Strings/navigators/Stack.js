import { StyleSheet, View, Image, Pressable, StatusBar } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Entypo from "@expo/vector-icons/Entypo";
import Ionicons from "@expo/vector-icons/Ionicons";
import Register from "../scenes/register";
import Login from "../scenes/login";
import Post from "../scenes/post";
import Details from "../scenes/details";
import Profile from "../scenes/profile";
import Search from "../scenes/search";
import BottomTab from "./BottomTab";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

const Stack = createNativeStackNavigator();

export default function RootStack() {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#fff",
      alignItems: "center",
      justifyContent: "center",
    },
    logoContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    logo: {
      width: 32,
      height: 32,
      resizeMode: "contain",
    },
    backButton: {
      paddingLeft: 16,
      paddingRight: 12,
      paddingVertical: 8,
    },
    searchButton: {
      paddingRight: 16,
      paddingLeft: 12,
      paddingVertical: 8,
    },
  });

  const { isSignedIn } = useContext(AuthContext);

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#000"
        translucent={false}
      />
      <Stack.Navigator
        initialRouteName={isSignedIn ? "Home" : "Login"}
        screenOptions={({ navigation, route }) => ({
          headerStyle: {
            backgroundColor: "#000",
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            color: "#fff",
            fontSize: 18,
            fontWeight: "600",
          },
          contentStyle: {
            backgroundColor: "#000",
          },
          cardStyle: {
            backgroundColor: "#000",
          },
          presentation: "card",
          animationEnabled: true,
          cardOverlayEnabled: false,
          cardShadowEnabled: false,
          gestureEnabled: true,
          gestureDirection: "horizontal",
          animationTypeForReplace: isSignedIn ? "push" : "pop",
          freezeOnBlur: true, // Freeze screen saat tidak aktif
          lazy: false, // Load screen segera
          headerTitle: () => (
            <Pressable>
              <View style={styles.logoContainer}>
                <Image
                  source={require("../assets/icon.png")}
                  style={styles.logo}
                />
              </View>
            </Pressable>
          ),
          headerLeft: () => {
            if (route.name === "Home") {
              return (
                <Pressable
                  style={styles.backButton}
                  onPress={() => {
                    navigation.navigate("Home", { screen: "HomeTab" });
                  }}
                >
                  <Ionicons name="arrow-back" size={24} color="white" />
                </Pressable>
              );
            }
            return null;
          },
          headerRight: () => (
            <Pressable
              onPress={() => navigation.navigate("Search")}
              style={styles.searchButton}
            >
              <Entypo name="magnifying-glass" size={24} color="white" />
            </Pressable>
          ),
        })}
      >
        {isSignedIn ? (
          <>
            <Stack.Screen name="Home" component={BottomTab} />
            <Stack.Screen
              name="Post"
              component={Post}
              options={{
                headerShown: false,
                cardStyle: { backgroundColor: "#000" },
                contentStyle: { backgroundColor: "#000" },
                presentation: "modal",
                gestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="Details"
              component={Details}
              options={{
                headerShown: false,
                cardStyle: { backgroundColor: "#000" },
                contentStyle: { backgroundColor: "#000" },
                presentation: "card",
                gestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="Search"
              component={Search}
              options={{
                headerShown: false,
                cardStyle: { backgroundColor: "#000" },
                contentStyle: { backgroundColor: "#000" },
                presentation: "card",
                gestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="Profile"
              component={Profile}
              options={{
                headerShown: false,
                cardStyle: { backgroundColor: "#000" },
                contentStyle: { backgroundColor: "#000" },
                presentation: "card",
                gestureEnabled: true,
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={Login}
              options={{
                headerShown: false,
                cardStyle: { backgroundColor: "#000" },
                contentStyle: { backgroundColor: "#000" },
              }}
            />
            <Stack.Screen
              name="Register"
              component={Register}
              options={{
                headerShown: false,
                cardStyle: { backgroundColor: "#000" },
                contentStyle: { backgroundColor: "#000" },
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </View>
  );
}
