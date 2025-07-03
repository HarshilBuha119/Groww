"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native"
import FastImage from "react-native-fast-image"
import Icon from "react-native-vector-icons/Ionicons"

const StockCard = ({ item, onPress, style, containerWidth }) => {
  const changeValue = Number.parseFloat(item.change) || 0
  const isPositive = changeValue >= 0
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  const isDataLoading =
    !item.symbol ||
    !item.price ||
    item.price === "Loading..." ||
    item.price === "..." ||
    item.price === "N/A" ||
    isNaN(Number.parseFloat(item.price))

  const formatPrice = (price) => {
    const numPrice = Number.parseFloat(price)
    if (isNaN(numPrice)) return "Loading..."
    return numPrice >= 1000 ? `$${(numPrice / 1000).toFixed(1)}K` : `$${numPrice.toFixed(2)}`
  }

  const formatChange = (change) => {
    const numChange = Number.parseFloat(change)
    return isNaN(numChange) ? "0.00" : Math.abs(numChange).toFixed(2)
  }

  const getStockIcon = (symbol) => {
    const icons = {
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
      CME: { bg: "#0066CC", text: "C" },
      AMD: { bg: "#ED1C24", text: "A" },
      HON: { bg: "#ED1C24", text: "H" },
      INTC: { bg: "#0071C5", text: "I" },
      INTU: { bg: "#365EBE", text: "I" },
      MSTR: { bg: "#F7931A", text: "M" },
      ABNB: { bg: "#FF5A5F", text: "A" },
    }
    return icons[symbol] || { bg: "#00D09C", text: symbol?.charAt(0) || "?" }
  }

  const cardStyle = containerWidth ? [styles.card, { width: containerWidth }] : styles.card
  const iconData = getStockIcon(item.symbol)

  if (isDataLoading) {
    return (
      <TouchableOpacity style={[cardStyle, style]} onPress={onPress} disabled>
        <View style={styles.cardContent}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#00D09C" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity style={[cardStyle, style]} onPress={onPress}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={[styles.stockIcon, { backgroundColor: item.logo && !imageError ? "transparent" : iconData.bg }]}>
            {item.logo && !imageError ? (
              <View style={styles.imageContainer}>
                <FastImage
                  source={{
                    uri: item.logo,
                    priority: FastImage.priority.normal,
                    cache: FastImage.cacheControl.immutable,
                  }}
                  style={styles.logoImage}
                  resizeMode={FastImage.resizeMode.contain}
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => setImageLoading(false)}
                  onError={() => {
                    console.log(`Failed to load logo for ${item.symbol}`)
                    setImageError(true)
                    setImageLoading(false)
                  }}
                />
                {imageLoading && (
                  <View style={styles.imageLoadingOverlay}>
                    <ActivityIndicator size="small" color="#00D09C" />
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.stockIconText}>{iconData.text}</Text>
            )}
          </View>
          <Icon
            name={isPositive ? "trending-up" : "trending-down"}
            size={16}
            color={isPositive ? "#00D09C" : "#FF4444"}
          />
        </View>

        <Text style={styles.stockSymbol} numberOfLines={1}>{item.symbol || "N/A"}</Text>
        <Text style={styles.stockName} numberOfLines={2}>{item.name || item.symbol || "Loading..."}</Text>
        <Text style={styles.stockPrice}>{formatPrice(item.price)}</Text>

        <View style={styles.changeContainer}>
          <Text style={[styles.stockChange, { color: isPositive ? "#00D09C" : "#FF4444" }]}>
            {isPositive ? "+" : ""}
            {formatChange(item.change)}%
          </Text>
        </View>

        {item.volume && Number.parseInt(item.volume) > 0 && (
          <Text style={styles.volumeText}>Vol: {Number.parseInt(item.volume).toLocaleString()}</Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    backgroundColor: "#1A1D21",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2A2D31",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardContent: { padding: 16 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  stockIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  imageContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    position: "relative",
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  imageLoadingOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(26, 29, 33, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  stockIconText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  stockSymbol: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  stockName: {
    fontSize: 12,
    fontWeight: "400",
    color: "#9CA3AF",
    marginBottom: 12,
    lineHeight: 16,
  },
  stockPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  stockChange: {
    fontSize: 14,
    fontWeight: "600",
  },
  volumeText: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "400",
  },
  loadingContainer: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 8,
    fontWeight: "500",
  },
})

export default StockCard
