// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   ActivityIndicator,
//   Alert,
//   StyleSheet
// } from "react-native";
// import * as DocumentPicker from "expo-document-picker";
// import * as FileSystem from "expo-file-system";
// import * as Sharing from "expo-sharing";
// import * as IntentLauncher from "expo-intent-launcher";
// import { MaterialCommunityIcons } from "@expo/vector-icons";

// /**
//  * AttachmentHandler component handles the addition, viewing, and deletion of attachments for a specific task.
//  *
//  * @param {Object} props - The properties object.
//  * @param {string} props.taskId - The ID of the task to which the attachment belongs.
//  * @param {Object} props.db - The database instance for performing database operations.
//  * @param {Object} [props.currentAttachment] - The current attachment object, if any.
//  * @param {string} props.currentAttachment.uri - The URI of the current attachment.
//  * @param {string} props.currentAttachment.fileName - The file name of the current attachment.
//  * @param {string} props.currentAttachment.type - The MIME type of the current attachment.
//  * @param {Function} props.onAttachmentUpdate - Callback function to notify the parent component of attachment updates.
//  *
//  * @returns {JSX.Element} The rendered component.
//  */
// const AttachmentHandler = ({
//   taskId,
//   db,
//   currentAttachment,
//   onAttachmentUpdate
// }) => {
//   const [loading, setLoading] = useState(false);

//   /**
//    * Handles adding a new attachment.
//    */
//   const handleAddAttachment = async () => {
//     try {
//       setLoading(true);
//       // Use DocumentPicker to pick a document
//       const result = await DocumentPicker.getDocumentAsync({
//         type: "*/*",
//         copyToCacheDirectory: true,
//         multiple: false
//       });

//       if (result.type === "success") {
//         // Create a permanent path in app's document directory
//         const permanentPath = `${FileSystem.documentDirectory}task_${taskId}_${result.name}`;

//         // Copy file from cache to permanent storage
//         await FileSystem.copyAsync({
//           from: result.uri,
//           to: permanentPath
//         });

//         // Save attachment info to database
//         await db.runAsync(
//           `INSERT OR REPLACE INTO attachments (taskId, uri, fileName, fileType)
//            VALUES (?, ?, ?, ?)`,
//           [taskId, permanentPath, result.name, result.mimeType]
//         );

//         // Notify parent component
//         onAttachmentUpdate({
//           uri: permanentPath,
//           fileName: result.name,
//           type: result.mimeType
//         });

//         Alert.alert("Success", "Attachment added successfully");
//       }
//     } catch (error) {
//       console.error("Error adding attachment:", error);
//       Alert.alert("Error", "Failed to add attachment");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /**
//    * Handles viewing the current attachment.
//    */
//   const handleViewAttachment = async () => {
//     if (!currentAttachment?.uri) {
//       Alert.alert("Error", "No attachment found");
//       return;
//     }

//     try {
//       const fileInfo = await FileSystem.getInfoAsync(currentAttachment.uri);
//       if (!fileInfo.exists) {
//         Alert.alert("Error", "Attachment file not found");
//         return;
//       }

//       // For Android, create a content URI and launch the intent
//       if (Platform.OS === "android") {
//         const contentUri = await FileSystem.getContentUriAsync(
//           currentAttachment.uri
//         );
//         await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
//           data: contentUri,
//           flags: 1,
//           type: currentAttachment.type || "*/*"
//         });
//       } else {
//         // For iOS, use sharing
//         await Sharing.shareAsync(currentAttachment.uri);
//       }
//     } catch (error) {
//       console.error("Error viewing attachment:", error);
//       Alert.alert("Error", "Unable to open attachment");
//     }
//   };

//   /**
//    * Handles deleting the current attachment.
//    */
//   const handleDeleteAttachment = async () => {
//     if (!currentAttachment?.uri) return;

//     try {
//       Alert.alert(
//         "Delete Attachment",
//         "Are you sure you want to delete this attachment?",
//         [
//           { text: "Cancel", style: "cancel" },
//           {
//             text: "Delete",
//             style: "destructive",
//             onPress: async () => {
//               // Delete file from filesystem
//               await FileSystem.deleteAsync(currentAttachment.uri, {
//                 idempotent: true
//               });

//               // Remove from database
//               await db.runAsync("DELETE FROM attachments WHERE taskId = ?", [
//                 taskId
//               ]);

//               // Update parent component
//               onAttachmentUpdate(null);

//               Alert.alert("Success", "Attachment deleted successfully");
//             }
//           }
//         ]
//       );
//     } catch (error) {
//       console.error("Error deleting attachment:", error);
//       Alert.alert("Error", "Failed to delete attachment");
//     }
//   };

//   return (
//     <View style={styles.container}>
//       {currentAttachment ? (
//         <View style={styles.attachmentRow}>
//           <TouchableOpacity
//             style={styles.viewButton}
//             onPress={handleViewAttachment}
//           >
//             <MaterialCommunityIcons
//               name="file-document"
//               size={24}
//               color="#007AFF"
//             />
//             <Text style={styles.fileName}>{currentAttachment.fileName}</Text>
//           </TouchableOpacity>
//           <View style={styles.actionButtons}>
//             <TouchableOpacity
//               style={styles.iconButton}
//               onPress={handleDeleteAttachment}
//             >
//               <MaterialCommunityIcons name="delete" size={24} color="#FF3B30" />
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={styles.iconButton}
//               onPress={handleAddAttachment}
//             >
//               <MaterialCommunityIcons
//                 name="file-replace"
//                 size={24}
//                 color="#007AFF"
//               />
//             </TouchableOpacity>
//           </View>
//         </View>
//       ) : (
//         <TouchableOpacity
//           style={styles.addButton}
//           onPress={handleAddAttachment}
//           disabled={loading}
//         >
//           {loading ? (
//             <ActivityIndicator size="small" color="#007AFF" />
//           ) : (
//             <>
//               <MaterialCommunityIcons
//                 name="attachment"
//                 size={24}
//                 color="#007AFF"
//               />
//               <Text style={styles.addButtonText}>Add Attachment</Text>
//             </>
//           )}
//         </TouchableOpacity>
//       )}
//     </View>
//   );
// };

// // Define styles for the component
// const styles = StyleSheet.create({
//   container: {
//     marginVertical: 10,
//     padding: 10
//   },
//   attachmentRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#f8f8f8",
//     padding: 10,
//     borderRadius: 8
//   },
//   viewButton: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center"
//   },
//   fileName: {
//     marginLeft: 10,
//     fontSize: 14,
//     color: "#007AFF"
//   },
//   actionButtons: {
//     flexDirection: "row"
//   },
//   iconButton: {
//     padding: 5,
//     marginLeft: 10
//   },
//   addButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#f8f8f8",
//     padding: 12,
//     borderRadius: 8,
//     justifyContent: "center"
//   },
//   addButtonText: {
//     marginLeft: 8,
//     color: "#007AFF",
//     fontSize: 16
//   }
// });

// export default AttachmentHandler;
