import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { MainScreen } from "../app_components/MainScreen";
import { ThemeProvider } from "../app_components/ThemeContext";
import * as SQLite from "expo-sqlite";

// Mock expo-sqlite
jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: jest.fn()
}));

const mockDb = {
  execAsync: jest.fn(),
  runAsync: jest.fn(),
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn()
};

SQLite.openDatabaseAsync.mockResolvedValue(mockDb);

// Mock other dependencies
jest.mock("@react-native-community/datetimepicker", () => ({
  default: () => null
}));

jest.mock("@react-native-picker/picker", () => ({
  Picker: ({ children }) => children
}));

jest.mock("expo-notifications", () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  setNotificationHandler: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn()
}));

describe("MainScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation((error) => {
      console.log("Console Error:", error);
    });
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it("renders correctly", async () => {
    const { getByText } = render(
      <ThemeProvider>
        <MainScreen />
      </ThemeProvider>
    );
    expect(getByText("Event Manager")).toBeTruthy();
  });

  it("opens the add task modal when the add button is pressed", async () => {
    const { getByTestId, getByPlaceholderText } = render(
      <ThemeProvider>
        <MainScreen />
      </ThemeProvider>
    );
    fireEvent.press(getByTestId("floating-add-button"));
    expect(getByPlaceholderText("Task Title")).toBeTruthy();
  });

  it("closes the add task modal when the close button is pressed", async () => {
    const { getByTestId, getByText, queryByPlaceholderText } = render(
      <ThemeProvider>
        <MainScreen />
      </ThemeProvider>
    );
    fireEvent.press(getByTestId("floating-add-button"));
    fireEvent.press(getByText("Close"));
    await waitFor(() => {
      expect(queryByPlaceholderText("Task Title")).toBeNull();
    });
  });

  it("saves a new task", async () => {
    mockDb.runAsync.mockResolvedValueOnce({ insertId: 1 });

    const { getByTestId, getByPlaceholderText, getByText } = render(
      <ThemeProvider>
        <MainScreen />
      </ThemeProvider>
    );
    fireEvent.press(getByTestId("floating-add-button"));
    fireEvent.changeText(getByPlaceholderText("Task Title"), "Test Task");
    fireEvent.changeText(
      getByPlaceholderText("Task Description"),
      "Test Description"
    );
    fireEvent.press(getByText("Add Task"));
    waitFor(() => {
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO tasks"),
        expect.arrayContaining(["Test Task", "Test Description"])
      );
    });
  });

  it("edits an existing task", async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([
      {
        id: 1,
        title: "Existing Task",
        description: "Existing Description",
        dueDate: new Date().toISOString(),
        recurring: 0,
        interval: "",
        status: "Pending"
      }
    ]);

    mockDb.getFirstAsync.mockResolvedValueOnce({
      id: 1,
      title: "Existing Task",
      description: "Existing Description",
      dueDate: new Date().toISOString(),
      recurring: 0,
      interval: ""
    });

    const { getByTestId, getByText, getByPlaceholderText } = render(
      <ThemeProvider>
        <MainScreen />
      </ThemeProvider>
    );

    await waitFor(() => expect(getByTestId("task-item-1")).toBeTruthy());

    fireEvent.press(getByTestId("task-item-1"));
    fireEvent.press(getByTestId("edit-task-1"));

    await waitFor(() => {
      expect(getByPlaceholderText("Task Title").props.value).toBe(
        "Existing Task"
      );
    });

    fireEvent.changeText(getByPlaceholderText("Task Title"), "Updated Task");
    fireEvent.press(getByText("Update Task"));

    waitFor(() => {
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE tasks"),
        expect.arrayContaining(["Updated Task"])
      );
    });
  });

  it("marks a task as done", async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([
      {
        id: 1,
        title: "Task to Complete",
        description: "Description",
        dueDate: new Date().toISOString(),
        recurring: 0,
        interval: "",
        status: "Pending"
      }
    ]);

    const { getByTestId } = render(
      <ThemeProvider>
        <MainScreen />
      </ThemeProvider>
    );

    await waitFor(() => expect(getByTestId("task-item-1")).toBeTruthy());

    fireEvent.press(getByTestId("task-item-1"));
    fireEvent.press(getByTestId("complete-task-1"));

    await waitFor(() => {
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE tasks SET status = ?"),
        expect.arrayContaining(["Done"])
      );
    });
  });

  it("deletes a task", async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([
      {
        id: 1,
        title: "Task to Delete",
        description: "Description",
        dueDate: new Date().toISOString(),
        recurring: 0,
        interval: "",
        status: "Pending"
      }
    ]);

    mockDb.getFirstAsync.mockResolvedValueOnce({
      id: 1,
      title: "Task to Delete",
      description: "Description",
      dueDate: new Date().toISOString(),
      recurring: 0,
      interval: ""
    });

    const { getByTestId, getByText } = render(
      <ThemeProvider>
        <MainScreen />
      </ThemeProvider>
    );

    await waitFor(() => expect(getByTestId("task-item-1")).toBeTruthy());

    fireEvent.press(getByTestId("task-item-1"));
    fireEvent.press(getByTestId("delete-task-1"));
    // Wait for the "OK" button to appear
    await waitFor(() => expect(getByText("OK")).toBeTruthy());

    fireEvent.press(getByText("OK"));
    await waitFor(() => {
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM tasks WHERE id = ?"),
        expect.arrayContaining([1])
      );
    });
  });

  it("archives a task", async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([
      {
        id: 1,
        title: "Task to Archive",
        description: "Description",
        dueDate: new Date().toISOString(),
        recurring: 0,
        interval: "",
        status: "Pending"
      }
    ]);

    const { getByTestId } = render(
      <ThemeProvider>
        <MainScreen />
      </ThemeProvider>
    );

    await waitFor(() => expect(getByTestId("task-item-1")).toBeTruthy());

    fireEvent.press(getByTestId("task-item-1"));
    fireEvent.press(getByTestId("archive-task-1"));

    await waitFor(() => {
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE tasks SET status = ?"),
        expect.arrayContaining(["Archived"])
      );
    });
  });

  it("filters tasks by upcoming", async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([
      {
        id: 1,
        title: "Upcoming Task",
        description: "Description",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        recurring: 0,
        interval: "",
        status: "Pending"
      },
      {
        id: 2,
        title: "Future Task",
        description: "Description",
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
        recurring: 0,
        interval: "",
        status: "Pending"
      }
    ]);

    const { getByText } = render(
      <ThemeProvider>
        <MainScreen />
      </ThemeProvider>
    );

    fireEvent.press(getByText("Show Upcoming"));

    await waitFor(() => {
      expect(getByText("Upcoming Task")).toBeTruthy();
      expect(() => getByText("Future Task")).toThrow();
    });
  });

  it("shows all tasks when 'Show All' is pressed", async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([
      {
        id: 1,
        title: "Upcoming Task",
        description: "Description",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        recurring: 0,
        interval: "",
        status: "Pending"
      },
      {
        id: 2,
        title: "Future Task",
        description: "Description",
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
        recurring: 0,
        interval: "",
        status: "Pending"
      }
    ]);

    const { getByText } = render(
      <ThemeProvider>
        <MainScreen />
      </ThemeProvider>
    );

    fireEvent.press(getByText("Show All"));

    await waitFor(() => {
      expect(getByText("Upcoming Task")).toBeTruthy();
      expect(getByText("Future Task")).toBeTruthy();
    });
  });

  it("displays task history", async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([
      {
        id: 1,
        taskId: 1,
        oldStatus: "Pending",
        newStatus: "Done",
        changeDate: new Date().toISOString(),
        title: "Completed Task",
        description: "Description",
        current_status: "Done"
      }
    ]);

    const { getByText } = render(
      <ThemeProvider>
        <MainScreen />
      </ThemeProvider>
    );

    fireEvent.press(getByText("History"));

    await waitFor(() => {
      expect(getByText("Completed Task")).toBeTruthy();
      expect(getByText("Status changed from Pending to Done")).toBeTruthy();
    });
  });

  it("handles recurring task completion", async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([
      {
        id: 1,
        title: "Recurring Task",
        description: "Description",
        dueDate: new Date().toISOString(),
        recurring: 1,
        interval: "daily",
        status: "Pending"
      }
    ]);

    mockDb.getFirstAsync.mockResolvedValueOnce({
      id: 1,
      title: "Recurring Task",
      description: "Description",
      dueDate: new Date().toISOString(),
      recurring: 1,
      interval: "daily"
    });

    const { getByTestId } = render(
      <ThemeProvider>
        <MainScreen />
      </ThemeProvider>
    );

    await waitFor(() => expect(getByTestId("task-item-1")).toBeTruthy());

    fireEvent.press(getByTestId("task-item-1"));
    fireEvent.press(getByTestId("complete-task-1"));

    waitFor(() => {
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE tasks SET status = ?"),
        expect.arrayContaining(["Done"])
      );
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO tasks"),
        expect.arrayContaining(["Recurring Task", "Description"])
      );
    });
  });

  it("handles task archiving for recurring tasks", async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([
      {
        id: 1,
        title: "Recurring Task",
        description: "Description",
        dueDate: new Date().toISOString(),
        recurring: 1,
        interval: "daily",
        status: "Pending"
      }
    ]);

    mockDb.getFirstAsync.mockResolvedValueOnce({
      id: 1,
      title: "Recurring Task",
      description: "Description",
      dueDate: new Date().toISOString(),
      recurring: 1,
      interval: "daily"
    });

    const { getByTestId, getByText } = render(
      <ThemeProvider>
        <MainScreen />
      </ThemeProvider>
    );

    await waitFor(() => expect(getByTestId("task-item-1")).toBeTruthy());

    fireEvent.press(getByTestId("task-item-1"));
    fireEvent.press(getByTestId("archive-task-1"));

    await waitFor(() => expect(getByText("Just This One")).toBeTruthy());

    fireEvent.press(getByText("Just This One"));

    await waitFor(() => {
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE tasks SET status = ?"),
        expect.arrayContaining(["Archived"])
      );
    });
  });
});
