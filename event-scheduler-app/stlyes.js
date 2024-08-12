
const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 50,
      paddingHorizontal: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
    },
    addButton: {
      position: 'absolute',
      right: 20,
      bottom: 20,
      width: 50,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f0f0f0',
      borderRadius: 25,
      zIndex: 1, // Ensure the button is above other components
    },
    addButtonImage: {
      width: 30,
      height: 30,
    },
    modalView: {
      margin: 20,
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 35,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
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
      marginBottom: 10,
    },
    taskItem: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#ccc',
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
      backgroundColor: '#007bff',
      borderRadius: 5,
    },
    buttonText: {
      color: 'white',
      textAlign: 'center',
    },
  });