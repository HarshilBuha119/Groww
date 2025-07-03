

import { useState, useContext } from "react"
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert } from "react-native"
import { WatchlistContext } from "../contexts/WatchListContext"

const AddToWatchlistModal = ({ visible, onClose, symbol, onSave }) => {
  const { watchlists } = useContext(WatchlistContext)
  const [newName, setNewName] = useState("")

  const existingWatchlists = Object.keys(watchlists).filter((name) => watchlists[name] && watchlists[name].length > 0)

  const handleSave = () => {
    if (newName.trim()) {
      onSave(newName.trim())
      setNewName("")
    } else {
      Alert.alert("Error", "Please enter a watchlist name")
    }
  }

  const handleSelectExisting = (listName) => {
    onSave(listName)
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Add {symbol} to Watchlist</Text>

          {existingWatchlists.length > 0 && (
            <>
              <Text style={styles.subtitle}>Select existing watchlist:</Text>
              <FlatList
                data={existingWatchlists}
                keyExtractor={(item) => item}
                style={styles.existingList}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.existingItem} onPress={() => handleSelectExisting(item)}>
                    <Text style={styles.existingItemText}>{item}</Text>
                    <Text style={styles.stockCount}>({watchlists[item]?.length || 0} stocks)</Text>
                  </TouchableOpacity>
                )}
              />
              <View style={styles.divider} />
            </>
          )}

          <Text style={styles.subtitle}>Or create new watchlist:</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter watchlist name"
            placeholderTextColor="#6B7280"
            value={newName}
            onChangeText={setNewName}
            autoCapitalize="words"
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveText}>Create & Add</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#1A1D21",
    padding: 24,
    width: "90%",
    maxHeight: "80%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A2D31",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
    color: "#FFFFFF",
  },
  existingList: {
    maxHeight: 150,
    marginBottom: 16,
  },
  existingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#0B0E11",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#2A2D31",
  },
  existingItemText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  stockCount: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  divider: {
    height: 1,
    backgroundColor: "#2A2D31",
    marginVertical: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#2A2D31",
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
    color: "#FFFFFF",
    backgroundColor: "#0B0E11",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#00D09C",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#374151",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginLeft: 8,
  },
  saveText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  cancelText: {
    color: "#FFFFFF",
    fontWeight: "500",
    fontSize: 16,
  },
})

export default AddToWatchlistModal
