import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet
} from "react-native";
import { Calendar } from "react-native-calendars";

const MAX_DOTS = 4;

/**
 * CalendarView component displays a calendar with tasks marked on their due dates.
 * Users can view tasks for a selected date, add new tasks, and update or delete existing tasks.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {Array} props.tasks - The list of tasks to display on the calendar.
 * @param {Function} props.onUpdateTask - Function to call when updating a task.
 * @param {Function} props.onDeleteTask - Function to call when deleting a task.
 * @param {Function} props.onAddTask - Function to call when adding a new task.
 * @returns {JSX.Element} The rendered CalendarView component.
 *
 * @example
 * return (
 *   <CalendarView
 *     tasks={tasks}
 *     onUpdateTask={handleUpdateTask}
 *     onDeleteTask={handleDeleteTask}
 *     onAddTask={handleAddTask}
 *   />
 * )
 *
 * @function
 * @name CalendarView
 *
 * @description
 * This component:
 * - Displays a calendar with tasks marked on their due dates.
 * - Allows users to view tasks for a selected date.
 * - Provides a modal to view task details and perform actions (update, delete).
 * - Allows users to add new tasks.
 *
 * @requires useState - React hook to manage component state.
 * @requires useEffect - React hook to perform side effects in the component.
 * @requires Calendar - Component from react-native-calendars to display the calendar.
 * @requires View - React Native component for rendering views.
 * @requires Text - React Native component for rendering text.
 * @requires TouchableOpacity - React Native component for touchable elements.
 * @requires Modal - React Native component for displaying modal dialogs.
 * @requires FlatList - React Native component for rendering lists.
 * @requires StyleSheet - React Native module for creating styles.
 */
const CalendarView = ({ tasks, onUpdateTask, onDeleteTask, onAddTask }) => {
  const [currentDate, setCurrentDate] = useState(formatDate(new Date()));
  const [selectedDate, setSelectedDate] = useState("");
  const [markedDates, setMarkedDates] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);

  /**
   * Formats a date to a string in the format YYYY-MM-DD.
   *
   * @param {Date} date - The date to format.
   * @returns {string} The formatted date string.
   */
  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Set the selected date and tasks for today when the component mounts
  useEffect(() => {
    setSelectedDate(currentDate);
    const tasksForToday = tasks.filter(
      (task) => formatDate(new Date(task.dueDate)) === currentDate
    );
    setSelectedTasks(tasksForToday);
  }, []);

  // Update marked dates when tasks change
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

  /**
   * Returns the color associated with a task status.
   *
   * @param {string} status - The status of the task.
   * @returns {string} The color associated with the status.
   */
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

  /**
   * Handles the event when a day is pressed on the calendar.
   *
   * @param {Object} day - The day object from the calendar.
   */
  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
    const tasksForDay = tasks.filter(
      (task) => formatDate(new Date(task.dueDate)) === day.dateString
    );
    setSelectedTasks(tasksForDay);
    setModalVisible(true);
  };

  /**
   * Renders a single task item.
   *
   * @param {Object} item - The task item to render.
   * @returns {JSX.Element} The rendered task item.
   */
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
          { backgroundColor: getStatusColor(item.status) }
        ]}
      />
      <Text style={styles.taskTitle}>{item.title}</Text>
      <Text style={styles.taskTime}>
        {new Date(item.dueDate).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        })}
      </Text>
    </TouchableOpacity>
  );

  /**
   * TaskDetailModal component renders a modal with task details and actions.
   *
   * @returns {JSX.Element} The rendered TaskDetailModal component.
   */
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
                Description: {selectedTask.description}
              </Text>
              <Text style={styles.modalDate}>
                Due: {new Date(selectedTask.dueDate).toLocaleString()}
              </Text>
              <Text style={styles.modalDate}>
                Interval: {selectedTask.interval}
              </Text>
              <Text style={styles.modalDate}>
                Status: {selectedTask.status}
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
            <Text style={{ fontWeight: "bold" }}>Add New Task</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setModalVisible(false);
              setSelectedTask(null);
            }}
            style={styles.closeButton}
          >
            <Text style={{ fontWeight: "bold" }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Calendar
        testID="calendar"
        current={currentDate}
        onDayPress={onDayPress}
        markedDates={{
          ...markedDates,
          [selectedDate]: {
            ...markedDates[selectedDate],
            selected: true,
            selectedColor: "lightblue"
          },
          [currentDate]: {
            ...markedDates[currentDate],
            selected: selectedDate === currentDate,
            selectedColor: "lightblue",
            dotColor: "red",
            marked: true
          }
        }}
        markingType={"multi-dot"}
        theme={{
          dotStyle: {
            width: 6,
            height: 6,
            borderRadius: 3,
            marginTop: 2,
            marginHorizontal: 1
          },
          todayTextColor: "red"
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

// Define styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)"
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    maxHeight: "80%"
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10
  },
  modalDescription: {
    marginBottom: 10
  },
  modalDate: {
    marginBottom: 10
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10
  },
  taskIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10
  },
  taskTitle: {
    flex: 1
  },
  taskTime: {
    marginLeft: 10
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10
  },
  modalButton: {
    padding: 10,
    backgroundColor: "#e0e0e0",
    fontWeight: "bold",
    borderRadius: 5
  },
  deleteButton: {
    backgroundColor: "#ff6b6b"
  },
  modalButtonText: {
    color: "black",
    fontWeight: "bold"
  },
  addButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10
  },
  closeButton: {
    backgroundColor: "#f44336",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10
  },
  todayButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
    marginHorizontal: 20
  },
  todayButtonText: {
    color: "white",
    fontWeight: "bold"
  }
});

export default CalendarView;
