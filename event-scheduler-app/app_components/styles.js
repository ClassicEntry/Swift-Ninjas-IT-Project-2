import { StyleSheet, Platform } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E0F7FA", // Light cyan background
  },
  titleContainer: {
    backgroundColor: "#006064", // Dark cyan
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  titleText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF", // White text
    textAlign: "center",
  },
  currentDateTime: {
    marginTop: 5,
    fontSize: 16,
    color: "#B2EBF2", // Light cyan text
  },
  taskList: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  taskItem: {
    padding: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#B2EBF2",
    marginTop: 20,
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#006064",
  },
  taskDescription: {
    fontSize: 16,
    color: "#004D40",
    marginTop: 5,
  },
  taskDueDate: {
    fontSize: 14,
    color: "#00796B",
    marginTop: 5,
  },
  taskStatus: {
    fontSize: 14,
    color: "#00796B",
    marginTop: 5,
  },
  taskRecurring: {
    fontSize: 14,
    color: "#00796B",
    marginTop: 5,
  },
  button: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#0097A7",
    borderRadius: 50,
    width: "25%",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
  },
  customButton: {
    backgroundColor: "#00838F",
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    width: "100%",
  },
  addButton: {
    position: "absolute",
    right: 20,
    bottom: Platform.OS === "ios" ? 30 : 20,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#00ACC1",
    borderRadius: 30,
    zIndex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonImage: {
    width: 30,
    height: 30,
    tintColor: "#FFFFFF", // White icon
  },
  modalView: {
    padding: 20,
    backgroundColor: "white",
    flexGrow: 1,
    alignItems: "center",
    marginTop: 50,
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#B2EBF2",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    fontSize: 16,
  },
  picker: {
    width: "100%",
    height: 85,
    marginBottom: 100,
  },
  list_calendar: {
    backgroundColor: "#00ACC1",
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
    padding: 10,
  },
  selectedDateContainer: {
    padding: 10,
    backgroundColor: "#f0f0f0",
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  noTasksText: {
    padding: 20,
    textAlign: "center",
    fontSize: 16,
    color: "#888",
  },
  options: {
    color: "#f0f0f0",
    fontWeight: "bold",
    backgroundColor: "#00ACC1",
    padding: 10,
    marginVertical: 10,
  },
  iconButton: {
    padding: 5,
    borderRadius: 5,
    borderWidth: 1,
    backgroundColor: "#00ACC1",
  },
  iconImage: {
    width: 24,
    height: 24,
  },
  ninjaLogo: {
    width: 50, // Set the width of the image
    height: 50, // Set the height of the image
    position: "absolute", // Position it in the top right corner
    right: 10, // Adjust the distance from the right edge
    top: 20, // Adjust the distance from the top edge
  },

  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editButton: {
    padding: 5,
  },
  smallIconImage: {
    width: 20,
    height: 20,
  },
  taskItemExpanded: {
    backgroundColor: "#F5FCFD",
  },
  taskDetails: {
    marginTop: 10,
  },
  taskOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
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
  overdueTask: {
    borderColor: "red",
    borderWidth: 1,
  },
  overdueText: {
    color: "red",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 5,
  },
  switchLabel: {
    fontSize: 14,
    color: "#333",
    marginRight: 10,
    fontWeight: "bold",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default styles;
