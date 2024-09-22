import React, { useState, useEffect } from 'react';
import { View, Text, FlatList } from 'react-native';
import { Calendar } from 'react-native-calendars';
import styles from './styles';

const CalendarView = ({ tasks }) => {
  const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
  const [selected, setSelected] = useState(currentDate);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedTasks, setSelectedTasks] = useState([]);

  useEffect(() => {
    const dates = tasks.reduce((acc, task) => {
      const date = task.dueDate.split('T')[0]; // Assuming dueDate is in ISO format
      acc[date] = { marked: true, dotColor: 'red' };
      return acc;
    }, {});
    setMarkedDates(dates);

    // Filter tasks for the current date
    const filteredTasks = tasks.filter(task => task.dueDate.startsWith(currentDate));
    setSelectedTasks(filteredTasks);
  }, [tasks]);

  const onDayPress = (day) => {
    setSelected(day.dateString);
    const filteredTasks = tasks.filter(task => 
      task.dueDate.startsWith(day.dateString)
    );
    setSelectedTasks(filteredTasks);
  };

  const renderTask = ({ item }) => (
    <View style={styles.taskItem}>
      <Text style={styles.taskTitle}>{item.title}</Text>
      <Text style={styles.taskDescription}>{item.description}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={onDayPress}
        markedDates={{
          ...markedDates,
          [selected]: { selected: true, disableTouchEvent: true, selectedDotColor: 'orange' }
        }}
      />
      <View style={styles.selectedDateContainer}>
        <Text style={styles.selectedDateText}>Events on {selected}</Text>
      </View>
      <FlatList
        data={selectedTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={styles.noTasksText}>No tasks for this date</Text>}
      />
    </View>
  );
};

export default CalendarView;