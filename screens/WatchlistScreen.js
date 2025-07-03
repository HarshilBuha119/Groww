

import { useContext, useState, useEffect } from "react"
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native"
import { WatchlistContext } from "../contexts/WatchListContext"
import StockCard from "../components/StockCard"
import EmptyState from "../components/EmptyState"
import Icon from "react-native-vector-icons/Ionicons"
import axios from "axios"

const WatchlistScreen = ({ navigation }) => {
  const { watchlists, removeFromWatchlist } = useContext(WatchlistContext)

  const [stockData, setStockData] = useState({})
  const [loading, setLoading] = useState(false)

  const groupedData = Object.entries(watchlists).filter(([name, symbols]) => symbols.length > 0)

  const fetchStockQuote = async (symbol) => {
    try {
      const [quoteResponse, profileResponse] = await Promise.all([
        axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=cuul0fpr01qk88s9fc0gcuul0fpr01qk88s9fc10`, {
          timeout: 10000,
        }),
        axios.get(
          `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=cuul0fpr01qk88s9fc0gcuul0fpr01qk88s9fc10`,
          { timeout: 10000 },
        ),
      ])

      const data = quoteResponse.data
      const profile = profileResponse.data

      if (data.c && data.c > 0) {
        const currentPrice = data.c
        const previousClose = data.pc
        const change = currentPrice - previousClose
        const changePercent = (change / previousClose) * 100
        return {
          symbol: symbol,
          name: profile.name || symbol,
          price: currentPrice.toFixed(2),
          change: changePercent.toFixed(2),
          logo: profile.logo || null,
        }
      }
      return null
    } catch (error) {
      console.error(`Error fetching ${symbol}:`, error.message)
      return null
    }
  }

  const fetchWatchlistData = async () => {
    setLoading(true)
    const allSymbols = Object.values(watchlists).flat()
    const uniqueSymbols = [...new Set(allSymbols)]

    const stockQuotes = {}
    for (const symbol of uniqueSymbols) {
      const quote = await fetchStockQuote(symbol)
      if (quote) {
        stockQuotes[symbol] = quote
      }
      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1100))
    }

    setStockData(stockQuotes)
    setLoading(false)
  }

  useEffect(() => {
    if (groupedData.length > 0) {
      fetchWatchlistData()
    }
  }, [watchlists])

  if (groupedData.length === 0) {
    return <EmptyState message="No watchlists added yet. Add stocks from the Explore tab!" />
  }

  const renderWatchlistSection = ({ item: [name, symbols] }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{name}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{symbols.length}</Text>
        </View>
      </View>
      <FlatList
        data={symbols}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(symbol) => symbol}
        renderItem={({ item: symbol }) => (
          <View style={styles.watchlistCard}>
            <StockCard
              item={
                stockData[symbol] || {
                  symbol,
                  name: symbol,
                  price: loading ? "Loading..." : "N/A",
                  change: loading ? "0" : "0",
                  logo: null,
                }
              }
              onPress={() =>
                navigation.navigate("Stocks", {
                  screen: "Product",
                  params: { symbol },
                })
              }
              onLongPress={() => {
                removeFromWatchlist(symbol)
              }}
              containerWidth="100%" // Pass 100% width for WatchlistScreen
            />
          </View>
        )}
        contentContainerStyle={styles.horizontalList}
      />
    </View>
  )

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Icon name="bookmark" size={20} color="#FFFFFF" />
            </View>
          </View>
          <View>
            <Text style={styles.headerTitle}>Watchlists</Text>
            <Text style={styles.headerSubtitle}>Your saved stocks</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Icon name="search" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Icon name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={groupedData}
        keyExtractor={([name]) => name}
        renderItem={renderWatchlistSection}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0E11",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoContainer: {
    marginRight: 12,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#00D09C",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    marginLeft: 20,
    padding: 8,
  },
  listContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  countBadge: {
    backgroundColor: "#1A1D21",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2D31",
  },
  countText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "500",
  },
  horizontalList: {
    paddingRight: 20,
  },
  watchlistCard: {
    width: 180, // Fixed width for horizontal scrolling
    marginRight: 12,
  },
})

export default WatchlistScreen
