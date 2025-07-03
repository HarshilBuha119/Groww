import { View, Text, StyleSheet } from "react-native"
import Icon from "react-native-vector-icons/Ionicons"

const EmptyState = ({ message, icon = "bookmark-outline" }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon name={icon} size={64} color="#6B7280" />
        </View>
        <Text style={styles.text}>{message}</Text>
        <Text style={styles.subText}>Start exploring stocks to build your watchlist!</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0E11",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#1A1D21",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    borderWidth: 2,
    borderColor: "#2A2D31",
  },
  text: {
    fontSize: 20,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "600",
  },
  subText: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 24,
  },
})

export default EmptyState
