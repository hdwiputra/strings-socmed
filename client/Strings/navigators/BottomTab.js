import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import Home from "../scenes/home";
import Profile from "../scenes/profile";

// Komponen Dummy
const MessageScreen = () => (
  <View style={styles.dummyScreen}>
    <Ionicons name="mail" size={50} color="#999" />
  </View>
);

const ActivityScreen = () => (
  <View style={styles.dummyScreen}>
    <Ionicons name="heart" size={50} color="#999" />
  </View>
);

const EmptyComponent = () => null;
const Tab = createBottomTabNavigator();

export default function BottomTab() {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#000" }}
      edges={["bottom"]}
    >
      <Tab.Navigator
        id="BottomTab"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            let iconSize = size;

            if (route.name === "HomeTab") {
              iconName = "home";
            } else if (route.name === "MessageTab") {
              iconName = "mail";
            } else if (route.name === "CreateTab") {
              iconName = "add";
              iconSize = 30;
            } else if (route.name === "ActivityTab") {
              iconName = "heart";
            } else if (route.name === "ProfileTab") {
              iconName = "person";
            }

            if (route.name === "CreateTab") {
              return (
                <View
                  style={[
                    styles.createButton,
                    focused && styles.createButtonFocused,
                  ]}
                >
                  <Ionicons
                    name={iconName}
                    size={iconSize}
                    color={focused ? "#000" : "#fff"}
                  />
                </View>
              );
            }

            return <Ionicons name={iconName} size={iconSize} color={color} />;
          },
          tabBarActiveTintColor: "#fff",
          tabBarInactiveTintColor: "#999",
          tabBarStyle: styles.tabBar,
          tabBarShowLabel: false,
          headerShown: false,
        })}
      >
        <Tab.Screen name="HomeTab" component={Home} />
        <Tab.Screen name="MessageTab" component={MessageScreen} />
        <Tab.Screen
          name="CreateTab"
          component={EmptyComponent}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              navigation.navigate("Post");
            },
          })}
        />
        <Tab.Screen name="ActivityTab" component={ActivityScreen} />
        <Tab.Screen name="ProfileTab" component={Profile} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#000",
    borderTopWidth: 0,
    height: 70,
    paddingBottom: 10,
    paddingTop: 10,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  createButtonFocused: {
    backgroundColor: "#fff",
  },
  dummyScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
});
