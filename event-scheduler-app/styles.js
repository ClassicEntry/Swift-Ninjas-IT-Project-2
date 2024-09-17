import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
 
  container: {
    flex: 1,
    paddingTop: 110, // Adjust this value based on the height of your title container
    paddingHorizontal: 20,
    backgroundColor: '#f0f0f0',
    fontFamily: 'Helvetica',
  },
  
  titleContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 20,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    zIndex: 2,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // Removed marginBottom
  },
  

  titleText: {
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center', // Center align the title text
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 58,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff8c3a',
    borderRadius: 29,
    zIndex: 1, // Ensure the button is above other components
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
    padding: 10,
    backgroundColor: '#ffffff', // White background for the bubble
    borderRadius: 20, // More rounded corners for a bubble-like appearance
    shadowColor: '#000', // Subtle shadow for depth
    shadowOffset: { width: 0, height: 4 }, // Adjusted for more shadow
    shadowOpacity: 0.3,
    shadowRadius: 10, // Larger shadow for a soft bubble effect
    elevation: 6, // Android elevation for consistent shadow
    borderWidth: 1,
    borderColor: '#e3e3e3', // Optional: Light border for a cleaner look
  marginTop:20,
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
  },
  addbutton_pressed:{
    color: '#f4f2ef'
    
  }
});

export default styles;
