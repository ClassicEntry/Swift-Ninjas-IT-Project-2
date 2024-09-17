import { StyleSheet, Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    fontFamily: 'Helvetica',
  },
  titleContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    elevation: 2, // For Android shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  titleText: {
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  currentDateTime: {
    marginTop: 5,
    fontSize: 16,
    color: '#666',
  },
  taskList: {
    paddingHorizontal: 20,
    paddingBottom: 80, // To prevent the last item from being hidden by the add button
  },
  taskItem: {
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e3e3e3',
    marginTop: 20,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
  },
  taskDueDate: {
    fontSize: 14,
    color: '#666',
  },
  taskStatus: {
    fontSize: 14,
    color: '#666',
  },
  taskRecurring: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#4FC1E9',
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
  },
  customButton: {
    backgroundColor: '#4FC1E9',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    width: '100%',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 30 : 20,
    width: 58,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff8c3a',
    borderRadius: 29,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonImage: {
    width: 60,
    height: 60,
  },
  modalView: {
    padding: 20,
    backgroundColor: 'white',
    flexGrow: 1,
    alignItems: 'center',
    marginTop: 50,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  picker: {
    width: '100%',
    height: 40,
    marginBottom: 150,
  },
});

export default styles;
