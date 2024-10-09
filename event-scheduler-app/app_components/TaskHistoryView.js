import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";

const TaskHistoryView = ({ db }) => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadTaskHistory();
  }, []);

  const loadTaskHistory = async () => {
    try {
      const result = await db.getAllAsync(`
        SELECT h.*, t.title, t.description 
        FROM history h 
        LEFT JOIN tasks t ON h.taskId = t.id 
        ORDER BY h.changeDate DESC
      `);
      setHistory(result);
    } catch (error) {
      console.log("Error loading task history:", error);
    }
  };

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyItem}>
      <Text style={styles.historyTitle}>{item.title || "Deleted Task"}</Text>
      <Text style={styles.historyDescription}>{item.description}</Text>
      <Text style={styles.historyChangeType}>{item.changeType}</Text>
      <Text style={styles.historyStatus}>
        {item.oldStatus !== "N/A"
          ? `${item.oldStatus} → ${item.newStatus}`
          : "New Task"}
      </Text>
      <Text style={styles.historyDate}>
        {new Date(item.changeDate).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <FlatList
      data={history}
      renderItem={renderHistoryItem}
      keyExtractor={(item) => item.id.toString()}
      ListEmptyComponent={
        <Text style={styles.emptyText}>No history available</Text>
      }
    />
  );
};

const styles = StyleSheet.create({
  historyItem: {
    backgroundColor: "#f8f8f8",
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  historyDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  historyChangeType: {
    fontSize: 16,
    fontWeight: "500",
    color: "#007AFF",
    marginTop: 5,
  },
  historyStatus: {
    fontSize: 14,
    marginTop: 5,
  },
  historyDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 5,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#666",
  },
});

export default TaskHistoryView;
