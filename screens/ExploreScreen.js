import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StockCard from '../components/StockCard';
import SectionHeader from '../components/SectionHeader';
import Icon from 'react-native-vector-icons/Ionicons';

const FINNHUB_API_KEY = 'abcdxyz';
const CACHE_KEY = 'explore_data';
const CACHE_EXPIRY = 5 * 60 * 1000;

const POPULAR_STOCKS = [
  'AAPL',
  'MSFT',
  'GOOGL',
  'AMZN',
  'TSLA',
  'META',
  'NVDA',
  'JPM',
  'CME',
  'UNH',
  'JNJ',
  'WMT',
  'ABNB',
  'AMD',
  'HON',
  'INTC',
  'INTU',
  'MSTR',
];

const ExploreScreen = ({ navigation }) => {
  const [stocks, setStocks] = useState([]);
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiStatus, setApiStatus] = useState('loading');

  // Search states
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const getCachedData = async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return data;
        }
      }
      return null;
    } catch (e) {
      console.error('Cache Error:', e.message);
      return null;
    }
  };

  const setCachedData = async data => {
    try {
      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ data, timestamp: Date.now() }),
      );
    } catch (e) {
      console.error('Cache Save Error:', e.message);
    }
  };

  const fetchStockQuote = async symbol => {
    try {
      const response = await axios.get(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`,
        {
          timeout: 1000,
        },
      );
      const data = response.data;
      if (data.c && data.c > 0) {
        const currentPrice = data.c;
        const previousClose = data.pc;
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;
        return {
          symbol: symbol,
          price: currentPrice.toFixed(2),
          change: changePercent.toFixed(2),
          changeAmount: change.toFixed(2),
          high: data.h?.toFixed(2) || currentPrice.toFixed(2),
          low: data.l?.toFixed(2) || currentPrice.toFixed(2),
          open: data.o?.toFixed(2) || currentPrice.toFixed(2),
          previousClose: previousClose?.toFixed(2) || currentPrice.toFixed(2),
        };
      }
      return null;
    } catch (error) {
      console.error(`Error fetching ${symbol}:`, error.message);
      return null;
    }
  };

  const fetchCompanyProfile = async symbol => {
    try {
      const response = await axios.get(
        `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`,
        { timeout: 1000 },
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching profile for ${symbol}:`, error.message);
      return null;
    }
  };

  const fetchAllStocks = async () => {
    console.log('🚀 Fetching stock data from Finnhub...');
    try {
      const stocksToFetch = POPULAR_STOCKS.slice(0, 12);
      const promises = stocksToFetch.map(async symbol => {
        const [quoteRes, profileRes] = await Promise.allSettled([
          fetchStockQuote(symbol),
          fetchCompanyProfile(symbol),
        ]);

        const quote = quoteRes.status === 'fulfilled' ? quoteRes.value : null;
        const profile =
          profileRes.status === 'fulfilled' ? profileRes.value : null;

        if (quote) {
          return {
            ...quote,
            name: profile?.name || symbol,
            logo: profile?.logo || null,
            country: profile?.country || 'US',
            currency: profile?.currency || 'USD',
            exchange: profile?.exchange || 'NASDAQ',
            marketCap: profile?.marketCapitalization || null,
            sector: profile?.finnhubIndustry || 'Technology',
          };
        }
        return null;
      });

      const results = await Promise.all(promises);
      const validStocks = results.filter(Boolean);

      console.log(`✅ Successfully fetched ${validStocks.length} stocks`);
      setApiStatus('success');

      const sortedStocks = validStocks.sort(
        (a, b) => Number.parseFloat(b.change) - Number.parseFloat(a.change),
      );

      const gainersData = sortedStocks.filter(
        s => Number.parseFloat(s.change) > 0,
      );

      const losersData = sortedStocks
        .filter(s => Number.parseFloat(s.change) < 0)
        .sort(
          (a, b) => Number.parseFloat(a.change) - Number.parseFloat(b.change),
        ); // lowest first

      return {
        stocks: validStocks,
        gainers: gainersData,
        losers: losersData,
      };
    } catch (error) {
      console.error('💥 Error fetching stocks:', error.message);
      setApiStatus('failed');
    }
  };

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
      const cachedData = await getCachedData();
      if (cachedData) {
        setStocks(cachedData.stocks || []);
        setGainers(cachedData.gainers || []);
        setLosers(cachedData.losers || []);
        setApiStatus(cachedData.apiStatus || 'success');
        setLoading(false);
      }
    }

    try {
      const { stocks, gainers, losers } = await fetchAllStocks();
      setStocks(stocks);
      setGainers(gainers);
      setLosers(losers);
      await setCachedData({
        stocks,
        gainers,
        losers,
        apiStatus,
        lastUpdated: new Date(),
      });
    } catch (e) {
      console.error('💥 Error in fetchData:', e.message);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // Search functionality
  const searchStocks = async query => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      // First try Finnhub search API
      const response = await axios.get(
        `https://finnhub.io/api/v1/search?q=${query}&token=${FINNHUB_API_KEY}`,
        {
          timeout: 5000,
        },
      );

      if (response.data && response.data.result) {
        const results = response.data.result.slice(0, 15).map(item => ({
          symbol: item.symbol,
          name: item.description,
          type: item.type,
          displaySymbol: item.displaySymbol,
        }));
        setSearchResults(results);
      }
    } catch (error) {
      console.error('Search API error:', error);
      // Fallback: search through existing stocks
      const filtered = stocks.filter(
        stock =>
          stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
          stock.name.toLowerCase().includes(query.toLowerCase()),
      );
      setSearchResults(filtered);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearch = text => {
    setSearchQuery(text);
    if (text.length > 1) {
      searchStocks(text);
    } else {
      setSearchResults([]);
    }
  };

  const onRefresh = () => {
    fetchData(true);
  };

  const renderApiStatus = () => {
    if (apiStatus === 'failed') {
      return (
        <View style={styles.apiStatusContainer}>
          <Icon name="warning" size={16} color="#FF9500" />
          <Text style={styles.apiStatusText}>
            Using demo data - API unavailable
          </Text>
        </View>
      );
    }
    return null;
  };

  const renderSearchModal = () => (
    <Modal
      visible={searchVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.searchContainer}>
        {/* Search Header */}
        <View style={styles.searchHeader}>
          <TouchableOpacity
            onPress={() => {
              setSearchVisible(false);
              setSearchQuery('');
              setSearchResults([]);
            }}
            style={styles.searchCloseButton}
          >
            <Icon name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.searchTitle}>Search Stocks</Text>
          <View style={styles.searchPlaceholder} />
        </View>

        {/* Search Input */}
        <View style={styles.searchInputContainer}>
          <Icon
            name="search"
            size={20}
            color="#9CA3AF"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by symbol or company name..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
            autoCapitalize="characters"
          />
          {searchLoading && (
            <ActivityIndicator
              size="small"
              color="#00D09C"
              style={styles.searchLoader}
            />
          )}
        </View>

        {/* Search Results */}
        <ScrollView
          style={styles.searchResults}
          showsVerticalScrollIndicator={false}
        >
          {searchResults.map((item, index) => (
            <TouchableOpacity
              key={`${item.symbol}-${index}`}
              style={styles.searchResultItem}
              onPress={() => {
                setSearchVisible(false);
                setSearchQuery('');
                setSearchResults([]);
                navigation.navigate('Product', { symbol: item.symbol });
              }}
            >
              <View style={styles.searchResultInfo}>
                <Text style={styles.searchResultSymbol}>{item.symbol}</Text>
                <Text style={styles.searchResultName} numberOfLines={2}>
                  {item.name || item.symbol}
                </Text>
                {item.type && (
                  <Text style={styles.searchResultType}>{item.type}</Text>
                )}
              </View>
              <Icon name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>
          ))}

          {/* No Results */}
          {searchQuery.length > 1 &&
            searchResults.length === 0 &&
            !searchLoading && (
              <View style={styles.noResults}>
                <Icon name="search" size={48} color="#6B7280" />
                <Text style={styles.noResultsText}>
                  No stocks found for "{searchQuery}"
                </Text>
                <Text style={styles.noResultsSubtext}>
                  Try searching with a different term
                </Text>
              </View>
            )}

          {/* Popular Searches */}
          {searchQuery.length === 0 && (
            <View style={styles.popularSearches}>
              <Text style={styles.popularTitle}>Popular Searches</Text>
              <View style={styles.popularGrid}>
                {POPULAR_STOCKS.slice(0, 8).map(symbol => (
                  <TouchableOpacity
                    key={symbol}
                    style={styles.popularItem}
                    onPress={() => {
                      setSearchVisible(false);
                      navigation.navigate('Product', { symbol });
                    }}
                  >
                    <Text style={styles.popularSymbol}>{symbol}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  const renderStockSection = (title, data, type) => {
    if (!data || data.length === 0) return null;
    return (
      <View style={styles.sectionContainer}>
        <SectionHeader
          title={title}
          type={type}
          onPressViewAll={() => navigation.navigate('ViewAll', { type, data })}
        />
        <View style={styles.stockGrid}>
          {data.slice(0, 4).map(item => (
            <StockCard
              key={item.symbol}
              item={item}
              onPress={() =>
                navigation.navigate('Product', { symbol: item.symbol })
              }
            />
          ))}
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D09C" />
        <Text style={styles.loadingText}>Loading market data...</Text>
        <Text style={styles.loadingSubtext}>
          Powered by Finnhub • Real-time data
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Icon name="trending-up" size={20} color="#FFFFFF" />
            </View>
          </View>
          <View>
            <Text style={styles.headerTitle}>Stocks</Text>
            <Text style={styles.headerSubtitle}>Live Market</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => setSearchVisible(true)}
          >
            <Icon name="search" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00D09C"
            colors={['#00D09C']}
            progressBackgroundColor="#1A1D21"
          />
        }
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {renderApiStatus()}
        {gainers.length > 0 &&
          renderStockSection('Top Gainers', gainers, 'gainers')}
        {losers.length > 0 &&
          renderStockSection('Top Losers', losers, 'losers')}
        {stocks.length === 0 && !loading && (
          <View style={styles.noDataContainer}>
            <Icon name="refresh" size={48} color="#6B7280" />
            <Text style={styles.noDataText}>No market data available</Text>
            <Text style={styles.noDataSubtext}>Pull down to refresh</Text>
          </View>
        )}
      </ScrollView>

      {/* Search Modal */}
      {renderSearchModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0E11',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0E11',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  loadingSubtext: {
    color: '#9CA3AF',
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#0B0E11',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    marginRight: 12,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#00D09C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginLeft: 20,
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  apiStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 16,
  },
  apiStatusText: {
    color: '#00D09C',
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
  sectionContainer: {
    marginBottom: 32,
  },
  stockGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noDataText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
  },
  noDataSubtext: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 8,
  },

  // Search Modal Styles
  searchContainer: {
    flex: 1,
    backgroundColor: '#0B0E11',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  searchCloseButton: {
    padding: 4,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchPlaceholder: {
    width: 32,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1D21',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2D31',
  },
  searchIcon: {
    marginLeft: 16,
  },
  searchInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  searchLoader: {
    marginRight: 16,
  },
  searchResults: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1D21',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2A2D31',
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  searchResultName: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  searchResultType: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  popularSearches: {
    paddingVertical: 20,
  },
  popularTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  popularItem: {
    backgroundColor: '#1A1D21',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2D31',
  },
  popularSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00D09C',
  },
});

export default ExploreScreen;
