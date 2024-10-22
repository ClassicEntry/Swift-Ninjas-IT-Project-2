import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import * as SQLite from "expo-sqlite";

const TaskHistoryView = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [db, setDb] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const initializeDatabase = async () => {
      try {
        setLoading(true);
        const database = await SQLite.openDatabaseAsync("tasks.db");

        if (isMounted) {
          setDb(database);
          await loadTaskHistory(database);
        }
      } catch (err) {
        console.error("Database initialization error:", err);
        if (isMounted) {
          setError("Failed to load task history");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeDatabase();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadTaskHistory = async (database) => {
    try {
      const result = await database.getAllAsync(`
        SELECT 
          h.id,
          h.taskId,
          h.oldStatus,
          h.newStatus,
          h.changeDate,
          t.title,
          t.description,
          CASE 
            WHEN t.id IS NULL THEN 'Deleted'
            ELSE t.status 
          END as current_status
        FROM history h
        LEFT JOIN tasks t ON h.taskId = t.id
        ORDER BY h.changeDate DESC
      `);

      setHistory(result);
    } catch (err) {
      console.error("Error loading task history:", err);
      setError("Failed to load task history");
      setHistory([]);
    }
  };

  const getStatusChangeText = (oldStatus, newStatus) => {
    if (oldStatus === "Created" && newStatus === "Pending") {
      return "Task created";
    }
    return `Status changed from ${oldStatus} to ${newStatus}`;
  };

  const renderHistoryItem = ({ item }) => (
    <View
      style={[
        styles.historyItem,
        item.current_status === "Deleted" && styles.deletedHistoryItem,
      ]}
    >
      <Text style={styles.historyTitle}>
        {item.title || "Task no longer exists"}
      </Text>
      <Text style={styles.historyStatus}>
        {getStatusChangeText(item.oldStatus, item.newStatus)}
      </Text>
      <Text style={styles.historyDate}>
        {new Date(item.changeDate).toLocaleString()}
      </Text>
      <Text
        style={[
          styles.currentStatus,
          item.current_status === "Deleted" && styles.deletedStatus,
        ]}
      >
        Current Status: {item.current_status}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#006064" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={history}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.historyList}
        onRefresh={() => loadTaskHistory(db)}
        refreshing={loading}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
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
  deletedHistoryItem: {
    backgroundColor: "#f8f8f8",
    borderColor: "#e0e0e0",
    borderWidth: 1,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#006064",
    marginBottom: 5,
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
  deletedStatus: {
    color: "#9e9e9e",
  },
  errorText: {
    fontSize: 16,
    color: "#d32f2f",
    textAlign: "center",
  },
});

export default TaskHistoryView;
