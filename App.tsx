import { NavigationContainer } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import Icon from "react-native-vector-icons/Ionicons"
import { WatchlistProvider } from "./contexts/WatchListContext"
import ExploreScreen from "./screens/ExploreScreen"
import WatchlistScreen from "./screens/WatchlistScreen"
import ViewAllScreen from "./screens/ViewAllScreen"
import ProductScreen from "./screens/ProductScreen"
import { StatusBar } from "react-native"

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function StocksStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Explore" component={ExploreScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="ViewAll"
        component={ViewAllScreen}
        options={({ route }) => ({
          title: route.params?.type === "gainers" ? "Top Gainers" : "Top Losers",
          headerStyle: {
            backgroundColor: "#0B0E11",
          },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            fontWeight: "600",
          },
        })}
      />
      <Stack.Screen
        name="Product"
        component={ProductScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  )
}

export default function App() {
  return (
    <WatchlistProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0B0E11" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused, color, size }) => {
              let iconName

              if (route.name === "Stocks") {
                iconName = focused ? "trending-up" : "trending-up-outline"
              } else if (route.name === "Watchlist") {
                iconName = focused ? "bookmark" : "bookmark-outline"
              }

              return <Icon name={iconName} size={size} color={color} />
            },
            tabBarActiveTintColor: "#00D09C",
            tabBarInactiveTintColor: "#6B7280",
            tabBarStyle: {
              backgroundColor: "#0B0E11",
              borderTopColor: "#2A2D31",
              borderTopWidth: 1,
              paddingBottom: 8,
              paddingTop: 8,
              height: 70,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: "500",
            },
          })}
        >
          <Tab.Screen name="Stocks" component={StocksStack} />
          <Tab.Screen name="Watchlist" component={WatchlistScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </WatchlistProvider>
  )
}
