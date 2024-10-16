import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from "react-native";
import { Calendar } from "react-native-calendars";

const MAX_DOTS = 4;

const CalendarView = ({ tasks, onUpdateTask, onDeleteTask, onAddTask }) => {
  const [currentDate, setCurrentDate] = useState(formatDate(new Date()));
  const [selectedDate, setSelectedDate] = useState("");
  const [markedDates, setMarkedDates] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);

  // Function to format date consistently
  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  useEffect(() => {
    setSelectedDate(currentDate);
    const tasksForToday = tasks.filter(
      (task) => formatDate(new Date(task.dueDate)) === currentDate
    );
    setSelectedTasks(tasksForToday);
  }, []);

  useEffect(() => {
    const marked = tasks.reduce((acc, task) => {
      const date = formatDate(new Date(task.dueDate));
      if (!acc[date]) {
        acc[date] = { dots: [] };
      }
      if (acc[date].dots.length < MAX_DOTS) {
        acc[date].dots.push({ color: getStatusColor(task.status) });
      } else if (acc[date].dots.length === MAX_DOTS) {
        acc[date].dots[MAX_DOTS - 1] = { color: "red", key: "more" };
      }
      return acc;
    }, {});
    setMarkedDates(marked);
  }, [tasks]);

  const getStatusColor = (status) => {
    switch (status) {
      case "overdue":
        return "red";
      case "completed":
        return "green";
      default:
        return "deepskyblue";
    }
  };

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
    const tasksForDay = tasks.filter(
      (task) => formatDate(new Date(task.dueDate)) === day.dateString
    );
    setSelectedTasks(tasksForDay);
    setModalVisible(true);
  };

  const renderTask = ({ item }) => (
    <TouchableOpacity
      style={styles.taskItem}
      onPress={() => {
        setSelectedTask(item);
        setModalVisible(true);
      }}
    >
      <View
        style={[
          styles.taskIndicator,
          { backgroundColor: getStatusColor(item.status) },
        ]}
      />
      <Text style={styles.taskTitle}>{item.title}</Text>
      <Text style={styles.taskTime}>
        {new Date(item.dueDate).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </TouchableOpacity>
  );

  const TaskDetailModal = () => (
    <Modal
      visible={modalVisible}
      transparent={true}
      onRequestClose={() => {
        setModalVisible(false);
        setSelectedTask(null);
      }}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {selectedTask ? (
            <>
              <Text style={styles.modalTitle}>{selectedTask.title}</Text>
              <Text style={styles.modalDescription}>
                {selectedTask.description}
              </Text>
              <Text style={styles.modalDate}>
                Due: {new Date(selectedTask.dueDate).toLocaleString()}
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    onUpdateTask(selectedTask.id);
                    setModalVisible(false);
                    setSelectedTask(null);
                  }}
                >
                  <Text style={styles.modalButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.deleteButton]}
                  onPress={() => {
                    onDeleteTask(selectedTask.id);
                    setModalVisible(false);
                    setSelectedTask(null);
                  }}
                >
                  <Text style={styles.modalButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <Text style={styles.modalTitle}>Tasks for {selectedDate}</Text>
          )}
          {!selectedTask && (
            <FlatList
              data={selectedTasks}
              renderItem={renderTask}
              keyExtractor={(item) => item.id.toString()}
            />
          )}
          <TouchableOpacity
            onPress={() => {
              onAddTask(new Date(selectedDate));
              setModalVisible(false);
              setSelectedTask(null);
            }}
            style={styles.addButton}
          >
            <Text>Add New Task</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setModalVisible(false);
              setSelectedTask(null);
            }}
            style={styles.closeButton}
          >
            <Text>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Calendar
        current={currentDate}
        onDayPress={onDayPress}
        markedDates={{
          ...markedDates,
          [selectedDate]: {
            ...markedDates[selectedDate],
            selected: true,
            selectedColor: "lightblue",
          },
          [currentDate]: {
            ...markedDates[currentDate],
            selected: selectedDate === currentDate,
            selectedColor: "lightblue",
            dotColor: "red",
            marked: true,
          },
        }}
        markingType={"multi-dot"}
        theme={{
          dotStyle: {
            width: 6,
            height: 6,
            borderRadius: 3,
            marginTop: 2,
            marginHorizontal: 1,
          },
          todayTextColor: "red",
        }}
      />
      <TouchableOpacity
        onPress={() => onDayPress({ dateString: currentDate })}
        style={styles.todayButton}
      >
        <Text style={styles.todayButtonText}>Show Today's Tasks</Text>
      </TouchableOpacity>
      <TaskDetailModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalDescription: {
    marginBottom: 10,
  },
  modalDate: {
    marginBottom: 10,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  taskIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  taskTitle: {
    flex: 1,
  },
  taskTime: {
    marginLeft: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  modalButton: {
    padding: 10,
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
  },
  deleteButton: {
    backgroundColor: "#ff6b6b",
  },
  modalButtonText: {
    color: "white",
  },
  addButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  closeButton: {
    backgroundColor: "#f44336",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  todayButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
    marginHorizontal: 20,
  },
  todayButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default CalendarView;
