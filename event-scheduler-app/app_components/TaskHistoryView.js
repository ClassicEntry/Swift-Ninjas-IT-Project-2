// TaskHistoryView.js

import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import * as SQLite from "expo-sqlite";

const TaskHistoryView = () => {
  const [history, setHistory] = useState([]);
  const [db, setDb] = useState(null);

  useEffect(() => {
    const initDatabase = async () => {
      const database = await SQLite.openDatabaseAsync("tasks.db");
      setDb(database);
      await loadTaskHistory(database);
    };

    initDatabase();
  }, []);

  const loadTaskHistory = async (database) => {
    try {
      const result = await database.getAllAsync(`
        SELECT h.*, t.title, t.description, 
               CASE 
                 WHEN t.id IS NULL THEN 'Deleted'
                 ELSE t.status
               END AS current_status
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
      <Text style={styles.historyDescription}>
        {item.description || "No description available"}
      </Text>
      <Text style={styles.historyStatus}>
        Status changed from {item.oldStatus} to {item.newStatus}
      </Text>
      <Text style={styles.historyDate}>
        Date: {new Date(item.changeDate).toLocaleString()}
      </Text>
      <Text style={styles.currentStatus}>
        Current Status: {item.current_status}
      </Text>
    </View>
  );

  return (
    <FlatList
      data={history}
      renderItem={renderHistoryItem}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.historyList}
    />
  );
};

const styles = StyleSheet.create({
  historyList: {
    padding: 10,
  },
  historyItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#006064",
  },
  historyDescription: {
    fontSize: 14,
    color: "#004D40",
    marginTop: 5,
  },
  historyStatus: {
    fontSize: 14,
    color: "#00796B",
    marginTop: 5,
  },
  historyDate: {
    fontSize: 12,
    color: "#00ACC1",
    marginTop: 5,
  },
  currentStatus: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#006064",
    marginTop: 5,
  },
});

export default TaskHistoryView;
