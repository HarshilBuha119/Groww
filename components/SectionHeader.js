import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { LinearGradient } from "react-native-linear-gradient"
import Icon from "react-native-vector-icons/Ionicons"

const SectionHeader = ({ title, type, onPressViewAll }) => {
  const getGradientColors = (type) => {
    switch (type) {
      case "gainers":
        return ["#00D09C", "#00A67E"]
      case "losers":
        return ["#FF4444", "#CC3333"]
      case "popular":
        return ["#4F46E5", "#7C3AED"]
      default:
        return ["#6B7280", "#4B5563"]
    }
  }

  const getIconName = (type) => {
    switch (type) {
      case "gainers":
        return "trending-up"
      case "losers":
        return "trending-down"
      case "popular":
        return "star"
      default:
        return "list"
    }
  }

  const gradientColors = getGradientColors(type)
  const iconName = getIconName(type)

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradientColors} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <View style={styles.titleContainer}>
          <Icon name={iconName} size={20} color="#FFFFFF" />
          <Text style={styles.title}>{title}</Text>
        </View>

        <TouchableOpacity onPress={onPressViewAll} style={styles.viewAllButton}>
          <Text style={styles.viewAll}>View All</Text>
          <Icon name="chevron-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginLeft: 8,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  viewAll: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "600",
    marginRight: 4,
  },
})

export default SectionHeader
