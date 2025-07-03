

import { useEffect, useState } from "react"
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native"
import StockCard from "../components/StockCard"

const ViewAllScreen = ({ route, navigation }) => {
  const { data } = route.params // 'gainers' or 'losers' and the data array
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    if (data && data.length > 0) {
      setStocks(data)
    }
    setLoading(false)
  }, [data])

  const renderItem = ({ item }) => (
    <View style={styles.cardContainer}>
      <StockCard
        item={item}
        onPress={() => navigation.navigate("Product", { symbol: item.fullSymbol || item.symbol })}
        containerWidth="100%" 
      />
    </View>
  )

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00D09C" />
      </View>
    )
  }

  if (!stocks.length) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No stocks available</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={stocks}
        keyExtractor={(item) => item.symbol}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.row}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0E11",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardContainer: {
    width: "48%", // Ensure proper width
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0B0E11",
  },
  emptyText: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
  },
})

export default ViewAllScreen
