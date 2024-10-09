import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import { Calendar } from "react-native-calendars";
import styles from "./styles";

const CalendarView = ({ tasks, onSelectDate, onTaskPress }) => {
  const [selected, setSelected] = useState("");
  const [markedDates, setMarkedDates] = useState({});
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const formatDate = (date) => {
    if (date instanceof Date) {
      return date.toISOString().split("T")[0];
    }
    return new Date(date).toISOString().split("T")[0];
  };

  useEffect(() => {
    const dates = tasks.reduce((acc, task) => {
      const date = formatDate(task.dueDate);
      acc[date] = {
        marked: true,
        dotColor: task.status === "Overdue" ? "red" : "blue",
      };
      return acc;
    }, {});
    setMarkedDates(dates);
  }, [tasks]);

  const onDayPress = (day) => {
    setSelected(day.dateString);
    const filteredTasks = tasks.filter((task) => {
      return formatDate(task.dueDate) === day.dateString;
    });
    setSelectedTasks(filteredTasks);
    onSelectDate(day.dateString);
  };

  const handleTaskPress = (task) => {
    setSelectedTask(task);
    setModalVisible(true);
    onTaskPress(task);
  };

  const renderTask = (task) => (
    <TouchableOpacity
      key={task.id}
      style={styles.calendarTaskItem}
      onPress={() => handleTaskPress(task)}
    >
      <Text style={styles.calendarTaskTitle}>{task.title}</Text>
      <Text style={styles.calendarTaskTime}>
        {new Date(task.dueDate).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.calendarContainer}>
      <Calendar
        onDayPress={onDayPress}
        markedDates={{
          ...markedDates,
          [selected]: {
            selected: true,
            disableTouchEvent: true,
            selectedDotColor: "orange",
          },
        }}
      />
      <View style={styles.selectedDateContainer}>
        <Text style={styles.selectedDateText}>Tasks on {selected}</Text>
      </View>
      <ScrollView style={styles.calendarTaskList}>
        {selectedTasks.map(renderTask)}
      </ScrollView>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            {selectedTask && (
              <>
                <Text style={styles.modalTitle}>{selectedTask.title}</Text>
                <Text style={styles.modalDescription}>
                  {selectedTask.description}
                </Text>
                <Text style={styles.modalDueDate}>
                  Due: {new Date(selectedTask.dueDate).toLocaleString()}
                </Text>
                <Text style={styles.modalStatus}>
                  Status: {selectedTask.status}
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalCloseButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CalendarView;
