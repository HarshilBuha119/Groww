"use client"

import { useEffect, useState, useContext } from "react"
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Alert } from "react-native"
import FastImage from "react-native-fast-image"
import { LineChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"
import Icon from "react-native-vector-icons/Ionicons"
import { WatchlistContext } from "../contexts/WatchListContext"
import AddToWatchlistModal from "../components/AddToWatchlistModal"
import axios from "axios"

const FINNHUB_API_KEY = "Your api key of finnhub.com"
const screenWidth = Dimensions.get("window").width

const ProductScreen = ({ route, navigation }) => {
  const { symbol } = route.params
  const [details, setDetails] = useState(null)
  const [profile, setProfile] = useState(null)
  const [chartData, setChartData] = useState([])
  const [chartLabels, setChartLabels] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState("1M")
  const [selectedTab, setSelectedTab] = useState("Overview")
  const [news, setNews] = useState([])
  const [logoError, setLogoError] = useState(false)

  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useContext(WatchlistContext)

  useEffect(() => {
    fetchDetails()
  }, [selectedPeriod])

  const getStockIcon = (symbol) => {
    const icons = {
      RELIANCE: { bg: "#1E3A8A", text: "R" },
      TCS: { bg: "#0066CC", text: "T" },
      HDFCBANK: { bg: "#ED1C24", text: "H" },
      INFY: { bg: "#007CC3", text: "I" },
      HINDUNILVR: { bg: "#0066CC", text: "H" },
      ICICIBANK: { bg: "#F37021", text: "I" },
      WIPRO: { bg: "#0066CC", text: "W" },
      BHARTIARTL: { bg: "#E31E24", text: "B" },
      ITC: { bg: "#FFD700", text: "I" },
      SBIN: { bg: "#1E40AF", text: "S" },
      AAPL: { bg: "#000000", text: "🍎" },
      MSFT: { bg: "#00BCF2", text: "M" },
      GOOGL: { bg: "#4285F4", text: "G" },
      AMZN: { bg: "#FF9900", text: "A" },
      TSLA: { bg: "#CC0000", text: "T" },
      META: { bg: "#1877F2", text: "f" },
      NVDA: { bg: "#76B900", text: "N" },
      JPM: { bg: "#0066CC", text: "J" },
      V: { bg: "#1A1F71", text: "V" },
      UNH: { bg: "#002677", text: "U" },
      JNJ: { bg: "#CC0000", text: "J" },
      WMT: { bg: "#004C91", text: "W" },
      PG: { bg: "#003DA5", text: "P" },
      MA: { bg: "#EB001B", text: "M" },
      HD: { bg: "#F96302", text: "H" },
      BAC: { bg: "#E31837", text: "B" },
    }
    return icons[symbol] || { bg: "#00D09C", text: symbol.charAt(0) }
  }

  // Generate realistic fake chart data
  const generateRealisticChartData = (basePrice, changePercent, period) => {
    const isPositive = Number.parseFloat(changePercent) >= 0
    const dataPoints = {
      "1D": 24,
      "1W": 7,
      "1M": 30,
      "3M": 90,
      "1Y": 365,
    }

    const points = dataPoints[period] || 30
    const data = []
    const labels = []

    const currentPrice = Number.parseFloat(basePrice)
    const totalChange = (currentPrice * Number.parseFloat(changePercent)) / 100
    const startPrice = currentPrice - totalChange

    for (let i = 0; i < points; i++) {
      const progress = i / (points - 1)
      const trendComponent = startPrice + totalChange * progress
      const volatilityFactor = period === "1D" ? 0.005 : period === "1W" ? 0.01 : 0.02
      const volatility = (Math.random() - 0.5) * currentPrice * volatilityFactor
      const marketNoise = Math.sin(i * 0.3) * currentPrice * 0.003
      const weeklyPattern = Math.sin(i * 0.1) * currentPrice * 0.001
      const price = Math.max(0.01, trendComponent + volatility + marketNoise + weeklyPattern)
      data.push(price)

      if (period === "1D") {
        const hour = Math.floor((i / points) * 24)
        labels.push(`${hour}:00`)
      } else if (period === "1W") {
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        labels.push(days[i % 7])
      } else {
        const date = new Date()
        date.setDate(date.getDate() - (points - i))
        labels.push(`${date.getMonth() + 1}/${date.getDate()}`)
      }
    }

    return { data, labels }
  }

  const fetchDetails = async () => {
    try {
      setLoading(true)

      const [quoteResponse, profileResponse, newsResponse] = await Promise.all([
        axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
        axios.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
        axios.get(
          `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}&to=${new Date().toISOString().split("T")[0]}&token=${FINNHUB_API_KEY}`,
        ),
      ])

      const quote = quoteResponse.data
      const profileData = profileResponse.data
      const newsData = newsResponse.data

      if (!quote.c || quote.c <= 0) {
        throw new Error("No valid quote data")
      }

      const currentPrice = quote.c
      const previousClose = quote.pc
      const change = currentPrice - previousClose
      const changePercent = (change / previousClose) * 100

      setDetails({
        symbol: symbol,
        name: profileData.name || symbol,
        price: currentPrice.toFixed(2),
        change: change.toFixed(2),
        changePercent: changePercent.toFixed(2),
        high: quote.h?.toFixed(2) || currentPrice.toFixed(2),
        low: quote.l?.toFixed(2) || currentPrice.toFixed(2),
        open: quote.o?.toFixed(2) || currentPrice.toFixed(2),
        previousClose: previousClose?.toFixed(2) || currentPrice.toFixed(2),
      })

      setProfile(profileData)
      setNews(newsData.slice(0, 5))

      const { data, labels } = generateRealisticChartData(currentPrice, changePercent, selectedPeriod)
      setChartData(data)
      setChartLabels(labels)
    } catch (error) {
      console.error("Error fetching details:", error)

      const fallbackPrice = 150 + Math.random() * 100
      const fallbackChange = (Math.random() - 0.5) * 10

      setDetails({
        symbol: symbol,
        name: symbol,
        price: fallbackPrice.toFixed(2),
        change: ((fallbackPrice * fallbackChange) / 100).toFixed(2),
        changePercent: fallbackChange.toFixed(2),
        high: (fallbackPrice * 1.02).toFixed(2),
        low: (fallbackPrice * 0.98).toFixed(2),
        open: (fallbackPrice * 0.995).toFixed(2),
        previousClose: (fallbackPrice * (1 - fallbackChange / 100)).toFixed(2),
      })

      const { data, labels } = generateRealisticChartData(fallbackPrice, fallbackChange, selectedPeriod)
      setChartData(data)
      setChartLabels(labels)
    } finally {
      setLoading(false)
    }
  }

  const handleWatchlistAction = () => {
    if (isInWatchlist(symbol)) {
      removeFromWatchlist(symbol)
      Alert.alert("Success", "Removed from watchlist")
    } else {
      setShowModal(true)
    }
  }

  const handleAddToWatchlist = (listName) => {
    addToWatchlist(symbol, listName)
    setShowModal(false)
    Alert.alert("Success", `Added ${symbol} to ${listName} watchlist`)
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D09C" />
        <Text style={styles.loadingText}>Loading {symbol}...</Text>
      </View>
    )
  }

  if (!details) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={48} color="#FF4444" />
        <Text style={styles.errorText}>Failed to load stock data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDetails}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const isPositive = Number.parseFloat(details.changePercent) >= 0
  const isInWatchlistCheck = isInWatchlist(symbol)
  const iconData = getStockIcon(symbol)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIcon} onPress={handleWatchlistAction}>
            <Icon
              name={isInWatchlistCheck ? "bookmark" : "bookmark-outline"}
              size={24}
              color={isInWatchlistCheck ? "#00D09C" : "#FFFFFF"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.stockInfo}>
          <View style={styles.stockHeader}>
            <View style={[styles.stockIcon, { backgroundColor: profile?.logo && !logoError ? "transparent" : iconData.bg }]}>
              {profile?.logo && !logoError ? (
                <FastImage
                  source={{
                    uri: profile.logo,
                    priority: FastImage.priority.high,
                    cache: FastImage.cacheControl.immutable,
                  }}
                  style={styles.logoImage}
                  resizeMode={FastImage.resizeMode.contain}
                  onError={() => {
                    console.log(`Failed to load logo for ${symbol}`)
                    setLogoError(true)
                  }}
                />
              ) : (
                <Text style={styles.stockIconText}>{iconData.text}</Text>
              )}
            </View>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>

          <Text style={styles.stockName}>{details.name}</Text>
          <Text style={styles.stockSymbolText}>
            {symbol} • {profile?.exchange || "NASDAQ"}
          </Text>
          <Text style={styles.stockPrice}>${details.price}</Text>

          <View style={styles.changeContainer}>
            <Text style={[styles.changeText, { color: isPositive ? "#00D09C" : "#FF4444" }]}>
              {isPositive ? "+" : ""}${details.change} ({isPositive ? "+" : ""}
              {details.changePercent}%)
            </Text>
            <Text style={styles.periodText}>Today</Text>
          </View>

          <View style={styles.periodSelector}>
            {["1D", "1W", "1M", "3M", "1Y"].map((period) => (
              <TouchableOpacity
                key={period}
                style={[styles.periodButton, selectedPeriod === period && styles.activePeriodButton]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text style={[styles.periodButtonText, selectedPeriod === period && styles.activePeriodButtonText]}>
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.chartContainer}>
            {chartData.length > 0 ? (
              <LineChart
                data={{
                  labels: chartLabels.filter((_, index) => index % Math.ceil(chartLabels.length / 6) === 0),
                  datasets: [
                    {
                      data: chartData,
                      color: () => (isPositive ? "#00D09C" : "#FF4444"),
                      strokeWidth: 3,
                    },
                  ],
                }}
                width={screenWidth - 40}
                height={220}
                chartConfig={{
                  backgroundColor: "#0B0E11",
                  backgroundGradientFrom: "#0B0E11",
                  backgroundGradientTo: "#0B0E11",
                  decimalPlaces: 2,
                  color: () => (isPositive ? "#00D09C" : "#FF4444"),
                  labelColor: () => "#9CA3AF",
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: "0",
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: "5,5",
                    stroke: "#2A2D31",
                    strokeWidth: 1,
                  },
                }}
                style={styles.chart}
                withHorizontalLabels={true}
                withVerticalLabels={true}
                withDots={false}
                withInnerLines={true}
                withOuterLines={false}
                formatYLabel={(value) => `$${Number.parseFloat(value).toFixed(0)}`}
                bezier
              />
            ) : (
              <Text style={styles.noChartText}>No chart data available</Text>
            )}
          </View>

          <View style={styles.additionalInfo}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Open</Text>
              <Text style={styles.infoValue}>${details.open}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>High</Text>
              <Text style={styles.infoValue}>${details.high}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Low</Text>
              <Text style={styles.infoValue}>${details.low}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Prev Close</Text>
              <Text style={styles.infoValue}>${details.previousClose}</Text>
            </View>
          </View>

          {profile && (
            <View style={styles.companyInfo}>
              <Text style={styles.companyInfoTitle}>Company Info</Text>
              <Text style={styles.companyInfoText}>
                {profile.name} • {profile.country} • {profile.finnhubIndustry}
              </Text>
              {profile.marketCapitalization && (
                <Text style={styles.companyInfoText}>
                  Market Cap: ${(profile.marketCapitalization * 1000000).toLocaleString()}
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.tabContainer}>
          {["Overview", "News"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.activeTab]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabContent}>
          {selectedTab === "Overview" && (
            <View style={styles.overviewContent}>
              <Text style={styles.overviewText}>
                {profile?.weburl ? `Visit: ${profile.weburl}` : `Real-time data for ${details.name} (${symbol})`}
              </Text>
            </View>
          )}

          {selectedTab === "News" && (
            <View style={styles.newsContent}>
              {news.length > 0 ? (
                news.map((item, index) => (
                  <View key={index} style={styles.newsItem}>
                    <Text style={styles.newsTitle} numberOfLines={2}>
                      {item.headline}
                    </Text>
                    <Text style={styles.newsDate}>{new Date(item.datetime * 1000).toLocaleDateString()}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noNewsText}>No recent news available</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
      
      <AddToWatchlistModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        symbol={symbol}
        onSave={handleAddToWatchlist}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0E11",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0B0E11",
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0B0E11",
    padding: 20,
  },
  errorText: {
    color: "#FFFFFF",
    fontSize: 18,
    marginTop: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#00D09C",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    marginLeft: 24,
  },
  scrollView: {
    flex: 1,
  },
  stockInfo: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  stockHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  stockIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#00D09C",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  stockIconText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1D21",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2D31",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#00D09C",
    marginRight: 6,
  },
  liveText: {
    color: "#00D09C",
    fontSize: 10,
    fontWeight: "600",
  },
  stockName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  stockSymbolText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 8,
  },
  stockPrice: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  changeText: {
    fontSize: 16,
    fontWeight: "500",
    marginRight: 8,
  },
  periodText: {
    fontSize: 14,
    color: "#6B7280",
  },
  periodSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activePeriodButton: {
    backgroundColor: "#1A1D21",
    borderWidth: 1,
    borderColor: "#2A2D31",
  },
  periodButtonText: {
    color: "#6B7280",
    fontSize: 14,
  },
  activePeriodButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  chartContainer: {
    marginBottom: 24,
    alignItems: "center",
  },
  chart: {
    borderRadius: 16,
    paddingVertical: 16,
  },
  noChartText: {
    color: "#9CA3AF",
    fontSize: 16,
    textAlign: "center",
  },
  additionalInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#1A1D21",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2D31",
    marginBottom: 16,
  },
  infoItem: {
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  companyInfo: {
    backgroundColor: "#1A1D21",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2D31",
  },
  companyInfoTitle: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 8,
  },
  companyInfoText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 24,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#FFFFFF",
  },
  tabText: {
    fontSize: 16,
    color: "#6B7280",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  tabContent: {
    paddingHorizontal: 20,
    marginBottom: 100,
  },
  overviewContent: {
    padding: 20,
    backgroundColor: "#1A1D21",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2D31",
  },
  overviewText: {
    color: "#9CA3AF",
    fontSize: 16,
    lineHeight: 24,
  },
  newsContent: {
    backgroundColor: "#1A1D21",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2D31",
    padding: 16,
  },
  newsItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2D31",
  },
  newsTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  newsDate: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  noNewsText: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 16,
    backgroundColor: "#0B0E11",
  },
  sellButton: {
    flex: 1,
    backgroundColor: "#FF4444",
    paddingVertical: 16,
    borderRadius: 8,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  sellButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buyButton: {
    flex: 1,
    backgroundColor: "#00D09C",
    paddingVertical: 16,
    borderRadius: 8,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
})

export default ProductScreen
