

import { createContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

export const WatchlistContext = createContext()

const WATCHLIST_STORAGE_KEY = "user_watchlists"

export const WatchlistProvider = ({ children }) => {
  const [watchlists, setWatchlists] = useState({})

  // Load watchlists from storage on app start
  useEffect(() => {
    loadWatchlists()
  }, [])

  // Save watchlists to storage whenever they change
  useEffect(() => {
    saveWatchlists()
  }, [watchlists])

  const loadWatchlists = async () => {
    try {
      const stored = await AsyncStorage.getItem(WATCHLIST_STORAGE_KEY)
      if (stored) {
        setWatchlists(JSON.parse(stored))
      }
    } catch (error) {
      console.error("Error loading watchlists:", error)
    }
  }

  const saveWatchlists = async () => {
    try {
      await AsyncStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlists))
    } catch (error) {
      console.error("Error saving watchlists:", error)
    }
  }

  const addToWatchlist = (symbol, listName) => {
    setWatchlists((prev) => {
      const updatedList = { ...prev }
      if (!updatedList[listName]) {
        updatedList[listName] = []
      }
      if (!updatedList[listName].includes(symbol)) {
        updatedList[listName].push(symbol)
      }
      return updatedList
    })
  }

  const removeFromWatchlist = (symbol) => {
    setWatchlists((prev) => {
      const updatedList = {}
      Object.keys(prev).forEach((key) => {
        updatedList[key] = prev[key].filter((s) => s !== symbol)
      })
      return updatedList
    })
  }

  const isInWatchlist = (symbol) => {
    return Object.values(watchlists).some((list) => list.includes(symbol))
  }

  const getWatchlistForSymbol = (symbol) => {
    for (const [listName, symbols] of Object.entries(watchlists)) {
      if (symbols.includes(symbol)) {
        return listName
      }
    }
    return null
  }

  return (
    <WatchlistContext.Provider
      value={{
        watchlists,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
        getWatchlistForSymbol,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  )
}
