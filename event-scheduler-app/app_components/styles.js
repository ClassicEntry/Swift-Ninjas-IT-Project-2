import { StyleSheet, Platform } from "react-native";

// Default colors (from the first styles)
const defaultColors = {
  background: "#E0F7FA",
  titleBackground: "#006064",
  titleText: "#FFFFFF",
  dateTimeText: "#B2EBF2",
  taskBackground: "#FFFFFF",
  taskBorder: "#B2EBF2",
  taskTitle: "#006064",
  taskDescription: "#004D40",
  taskDate: "#00796B",
  buttonBackground: "#0097A7",
  customButtonBackground: "#00838F",
  addButtonBackground: "#00ACC1",
  listCalendarBackground: "#00ACC1",
  iconButtonBackground: "#00ACC1",
  expandedTaskBackground: "#F5FCFD",
  error: "red"
};

// Create styles function that allows theming (from first set of styles)
const createStyles = (theme = null) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme?.background || defaultColors.background
    },
    titleContainer: {
      backgroundColor: theme?.primary || defaultColors.titleBackground,
      paddingVertical: 20,
      paddingHorizontal: 20,
      alignItems: "center",
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4
    },
    titleText: {
      fontSize: 36,
      fontWeight: "bold",
      color: defaultColors.titleText,
      textAlign: "center"
    },
    currentDateTime: {
      marginTop: 5,
      fontSize: 16,
      color: defaultColors.dateTimeText
    },
    taskList: {
      paddingHorizontal: 20,
      paddingBottom: 80
    },
    taskItem: {
      padding: 15,
      backgroundColor: defaultColors.taskBackground,
      borderRadius: 15,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 3,
      borderWidth: 1,
      borderColor: defaultColors.taskBorder,
      marginTop: 20
    },
    taskTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: defaultColors.taskTitle
    },
    taskDescription: {
      fontSize: 16,
      color: defaultColors.taskDescription,
      marginTop: 5
    },
    taskDueDate: {
      fontSize: 14,
      color: defaultColors.taskDate,
      marginTop: 5
    },
    taskStatus: {
      fontSize: 14,
      color: defaultColors.taskDate,
      marginTop: 5
    },
    taskRecurring: {
      fontSize: 14,
      color: defaultColors.taskDate,
      marginTop: 5
    },
    button: {
      marginTop: 10,
      padding: 10,
      backgroundColor: defaultColors.buttonBackground,
      borderRadius: 50,
      width: "25%"
    },
    buttonText: {
      color: "white",
      textAlign: "center"
    },
    customButton: {
      backgroundColor: defaultColors.customButtonBackground,
      padding: 10,
      borderRadius: 5,
      marginVertical: 5,
      width: "100%"
    },
    addButton: {
      position: "absolute",
      right: 20,
      bottom: Platform.OS === "ios" ? 30 : 20,
      width: 60,
      height: 60,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: defaultColors.addButtonBackground,
      borderRadius: 30,
      zIndex: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 5
    },
    addButtonImage: {
      width: 30,
      height: 30,
      tintColor: "#FFFFFF"
    },
    modalView: {
      padding: 20,
      backgroundColor: "white",
      flexGrow: 1,
      alignItems: "center",
      marginTop: 50
    },
    input: {
      width: "100%",
      height: 50,
      borderColor: defaultColors.taskBorder,
      borderWidth: 1,
      borderRadius: 5,
      marginBottom: 10,
      fontSize: 16
    },
    picker: {
      width: "100%",
      height: 85,
      marginBottom: 100
    },
    list_calendar: {
      backgroundColor: defaultColors.listCalendarBackground,
      flexDirection: "row",
      justifyContent: "space-around",
      padding: 10
    },
    selectedDateContainer: {
      padding: 10,
      backgroundColor: "#f0f0f0"
    },
    selectedDateText: {
      fontSize: 16,
      fontWeight: "bold"
    },
    noTasksText: {
      padding: 20,
      textAlign: "center",
      fontSize: 16,
      color: "#888"
    },
    options: {
      color: "#f0f0f0",
      fontWeight: "bold",
      backgroundColor: defaultColors.iconButtonBackground,
      padding: 10,
      marginVertical: 10
    },
    iconButton: {
      padding: 5,
      borderRadius: 5,
      borderWidth: 1,
      backgroundColor: defaultColors.iconButtonBackground
    },
    iconImage: {
      width: 24,
      height: 24
    },
    ninjaLogo: {
      width: 50,
      height: 50,
      position: "absolute",
      right: 10,
      top: 20
    },
    taskHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center"
    },
    editButton: {
      padding: 5
    },
    smallIconImage: {
      width: 20,
      height: 20
    },
    taskItemExpanded: {
      backgroundColor: defaultColors.expandedTaskBackground
    },
    taskDetails: {
      marginTop: 10
    },
    taskOptions: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginTop: 10
    },
    historyList: {
      padding: 10
    },
    historyItem: {
      backgroundColor: defaultColors.taskBackground,
      borderRadius: 8,
      padding: 15,
      marginBottom: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    },
    historyTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: defaultColors.taskTitle
    },
    historyDescription: {
      fontSize: 14,
      color: defaultColors.taskDescription,
      marginTop: 5
    },
    historyStatus: {
      fontSize: 14,
      color: defaultColors.taskDate,
      marginTop: 5
    },
    historyDate: {
      fontSize: 12,
      color: defaultColors.addButtonBackground,
      marginTop: 5
    },
    currentStatus: {
      fontSize: 14,
      fontWeight: "bold",
      color: defaultColors.taskTitle,
      marginTop: 5
    },
    overdueTask: {
      borderColor: defaultColors.error,
      borderWidth: 1
    },
    overdueText: {
      color: defaultColors.error
    },
    switchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#fff",
      borderRadius: 5
    },
    switchLabel: {
      fontSize: 14,
      color: "#333",
      marginRight: 10,
      fontWeight: "bold"
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: "bold",
      textAlign: "center"
    }
  });

// Export the function and styles
const styles = createStyles();
export { createStyles };
export default styles;
