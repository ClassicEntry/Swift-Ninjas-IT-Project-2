import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { MainScreen } from "../app_components/MainScreen";
import { ThemeProvider } from "../app_components/ThemeContext";
import * as SQLite from "expo-sqlite";
import { Alert } from "react-native";

// Mock SQLite
jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: jest.fn()
}));

// Mock expo-notifications with proper implementation
jest.mock("expo-notifications", () => ({
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted" })
  ),
  setNotificationHandler: jest.fn((callback) => callback),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve()),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  addNotificationReceivedListener: jest.fn(() => ({
    remove: jest.fn()
  })),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn()
  }))
}));

// Mock DateTimePicker
jest.mock("@react-native-community/datetimepicker", () => {
  const MockDateTimePicker = ({ testID, value, mode, onChange }) => {
    return null;
  };
  MockDateTimePicker.displayName = "DateTimePicker";
  return MockDateTimePicker;
});

// Mock Picker
jest.mock("@react-native-picker/picker", () => ({
  Picker: ({ children, testID, selectedValue, onValueChange }) => null
}));

// Mock Alert
jest.mock("react-native/Libraries/Alert/Alert", () => ({
  alert: jest.fn((title, message, buttons) => {
    if (buttons && buttons.length > 0) {
      // Always trigger the last button (usually the confirm action)
      const lastButton = buttons[buttons.length - 1];
      if (lastButton.onPress) {
        lastButton.onPress();
      }
    }
  })
}));

// Initialize constants and helper functions at the top level
const mockDb = {
  execAsync: jest.fn(),
  runAsync: jest.fn(),
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn()
};

const renderMainScreen = () => {
  return render(
    <ThemeProvider>
      <MainScreen />
    </ThemeProvider>
  );
};

describe("MainScreen", () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset timers
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-01"));

    // Setup database mock
    SQLite.openDatabaseAsync.mockResolvedValue(mockDb);
    mockDb.getAllAsync.mockResolvedValue([]);
    mockDb.runAsync.mockResolvedValue({ insertId: 1 });

    // Setup console mock
    jest.spyOn(console, "error").mockImplementation(() => {});

    // Reset notification permissions mock for each test
    require("expo-notifications").requestPermissionsAsync.mockImplementation(
      () => Promise.resolve({ status: "granted" })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    console.error.mockRestore();
    jest.useRealTimers();
  });

  it("renders correctly", async () => {
    const { getByText } = renderMainScreen();
    expect(getByText("Event Manager")).toBeTruthy();
  });

  it("opens the add task modal when the add button is pressed", async () => {
    const { getByTestId, getByPlaceholderText } = renderMainScreen();
    fireEvent.press(getByTestId("floating-add-button"));
    expect(getByPlaceholderText("Task Title")).toBeTruthy();
  });

  it("closes the add task modal when the close button is pressed", async () => {
    const { getByTestId, getByText, queryByPlaceholderText } =
      renderMainScreen();
    fireEvent.press(getByTestId("floating-add-button"));
    fireEvent.press(getByText("Close"));

    expect(queryByPlaceholderText("Task Title")).toBeNull();
  });

  it("saves a new task", async () => {
    const { getByTestId, getByPlaceholderText, getByText } = renderMainScreen();
    fireEvent.press(getByTestId("floating-add-button"));
    fireEvent.changeText(getByPlaceholderText("Task Title"), "Test Task");
    fireEvent.changeText(
      getByPlaceholderText("Task Description"),
      "Test Description"
    );
    fireEvent.press(getByText("Add Task"));
    await waitFor(() => {
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

    const { getByTestId, getByText, getByPlaceholderText } = renderMainScreen();

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

    await waitFor(() => {
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

    const { getByTestId } = renderMainScreen();

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
    // Mock the database response to return a task
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

    // Mock the database response for getting the first task
    mockDb.getFirstAsync.mockResolvedValueOnce({
      id: 1,
      title: "Task to Delete",
      description: "Description",
      dueDate: new Date().toISOString(),
      recurring: 0,
      interval: ""
    });

    const { getByTestId, getByText } = renderMainScreen();

    // Wait for the task to be rendered
    await waitFor(() => expect(getByTestId("task-item-1")).toBeTruthy());

    // Simulate pressing the task item to open options
    fireEvent.press(getByTestId("task-item-1"));
    // Simulate pressing the delete button
    fireEvent.press(getByTestId("delete-task-1"));

    // Wait for the confirmation dialog to appear and press "OK"
    await waitFor(() => expect(getByText("OK")).toBeTruthy());
    fireEvent.press(getByText("OK"));

    // Wait for the database call to delete the task
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

    const { getByTestId } = renderMainScreen();

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

    const { getByText } = renderMainScreen();

    fireEvent.press(getByText("Show All"));

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

    const { getByText } = renderMainScreen();

    fireEvent.press(getByText("Show All"));

    await waitFor(() => {
      expect(getByText("Upcoming Task")).toBeTruthy();
      expect(getByText("Future Task")).toBeTruthy();
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

    const { getByTestId } = renderMainScreen();

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

    const { getByTestId, getByText } = renderMainScreen();

    await waitFor(() => expect(getByTestId("task-item-1")).toBeTruthy());

    fireEvent.press(getByTestId("task-item-1"));
    fireEvent.press(getByTestId("archive-task-1"));

    await waitFor(() => expect(getByText("Just This One")).toBeTruthy());

    fireEvent.press(getByText("Just This One"));

    await waitFor(() => {
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE tasks SET status = ?"),
        expect.arrayContaining(["Archived", 1])
      );
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO history"),
        expect.arrayContaining([
          1,
          expect.any(String),
          "Archived",
          expect.any(String)
        ])
      );
    });
  });

  // Test notification permissions and scheduling
  it("requests notification permissions on mount", async () => {
    renderMainScreen();

    await waitFor(() => {
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });
  });

  // Test recurring task creation
  it("creates a recurring task correctly", async () => {
    const { getByTestId, getByText, getByPlaceholderText } = renderMainScreen();

    // Open add task modal
    fireEvent.press(getByTestId("floating-add-button"));

    // Fill in task details
    fireEvent.changeText(getByPlaceholderText("Task Title"), "Recurring Test");
    fireEvent.changeText(
      getByPlaceholderText("Task Description"),
      "Test Description"
    );

    // Enable recurring and select interval
    const recurringSwitch = getByTestId("recurring-switch");
    fireEvent.press(recurringSwitch);

    // Mock the picker selection
    const picker = getByTestId("interval-picker");
    fireEvent(picker, "onValueChange", "daily");

    // Save the task
    fireEvent.press(getByText("Add Task"));

    await waitFor(() => {
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO tasks"),
        expect.arrayContaining([
          "Recurring Test",
          "Test Description",
          expect.any(String),
          1,
          "daily",
          "Pending",
          null
        ])
      );
    });
  });

  // Test date and time handling
  it("handles date and time selection correctly", async () => {
    const { getByTestId, getByText } = renderMainScreen();

    fireEvent.press(getByTestId("floating-add-button"));

    // Select date
    fireEvent.press(getByText("Select Due Date"));
    const testDate = new Date(2024, 0, 1); // January 1, 2024

    await act(async () => {
      fireEvent(getByTestId("date-picker"), "onChange", {
        nativeEvent: { timestamp: testDate.getTime() }
      });
    });

    // Select time
    fireEvent.press(getByText("Select Due Time"));
    const testTime = new Date(2024, 0, 1, 14, 30); // 2:30 PM

    await act(async () => {
      fireEvent(getByTestId("time-picker"), "onChange", {
        nativeEvent: { timestamp: testTime.getTime() }
      });
    });

    expect(getByText("Selected Date and Time: 1/1/2024 2:30 PM")).toBeTruthy();
  });

  // Test task filtering
  it("filters tasks correctly by date range", async () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const mockTasks = [
      {
        id: 1,
        title: "Today's Task",
        dueDate: today.toISOString(),
        status: "Pending"
      },
      {
        id: 2,
        title: "Next Week's Task",
        dueDate: nextWeek.toISOString(),
        status: "Pending"
      }
    ];

    mockDb.getAllAsync.mockResolvedValueOnce(mockTasks);

    const { getByText, queryByText } = renderMainScreen();

    // Ensure initial load shows all tasks
    await waitFor(() => {
      expect(getByText("Today's Task")).toBeTruthy();
      expect(getByText("Next Week's Task")).toBeTruthy();
    });

    // Filter to show only upcoming tasks
    fireEvent.press(getByText("Tasks"));
    fireEvent.press(getByText("Show Upcoming"));

    await waitFor(() => {
      expect(getByText("Today's Task")).toBeTruthy();
      expect(queryByText("Next Week's Task")).toBeNull();
    });
  });

  // Test task status updates
  it("handles task status updates correctly", async () => {
    const mockTask = {
      id: 1,
      title: "Test Task",
      description: "Description",
      dueDate: new Date().toISOString(),
      status: "Pending"
    };

    mockDb.getAllAsync.mockResolvedValueOnce([mockTask]);
    mockDb.getFirstAsync.mockResolvedValueOnce(mockTask);

    const { getByTestId } = renderMainScreen();

    await waitFor(() => {
      expect(getByTestId("task-item-1")).toBeTruthy();
    });

    // Test marking as done
    fireEvent.press(getByTestId("task-item-1"));
    fireEvent.press(getByTestId("complete-task-1"));

    await waitFor(() => {
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE tasks SET status = ?"),
        ["Done", 1]
      );
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO history"),
        expect.arrayContaining([1, "Pending", "Done"])
      );
    });
  });

  // Test edge cases
  it("handles database initialization errors gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "log");
    SQLite.openDatabaseAsync.mockRejectedValueOnce(new Error("DB Error"));

    renderMainScreen();

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error initializing database:",
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  // Test notification scheduling for different task types
  it("schedules notifications correctly for different task types", async () => {
    const tasks = [
      {
        id: 1,
        title: "Daily Task",
        recurring: true,
        interval: "daily",
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        status: "Pending"
      },
      {
        id: 2,
        title: "Weekly Task",
        recurring: true,
        interval: "weekly",
        dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
        status: "Pending"
      },
      {
        id: 3,
        title: "Overdue Task",
        recurring: false,
        dueDate: new Date(Date.now() - 86400000).toISOString(),
        status: "Pending"
      }
    ];

    mockDb.getAllAsync.mockResolvedValueOnce(tasks);

    renderMainScreen();

    waitFor(() => {
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(4); // Including warning notifications
    });
  });

  // Test form validation
  it("validates task form correctly", async () => {
    const { getByTestId, getByPlaceholderText, getByText } = renderMainScreen();

    fireEvent.press(getByTestId("floating-add-button"));

    // Try to save without title
    fireEvent.press(getByText("Add Task"));
    await waitFor(() => {
      expect(mockDb.runAsync).not.toHaveBeenCalled();
    });

    // Enable recurring without interval
    fireEvent.changeText(getByPlaceholderText("Task Title"), "Test Task");
    const recurringSwitch = getByTestId("recurring-switch");
    fireEvent.press(recurringSwitch);
    fireEvent.press(getByText("Add Task"));

    await waitFor(() => {
      expect(mockDb.runAsync).not.toHaveBeenCalled();
    });
  });

  // Test calendar view interactions
  it("handles calendar view interactions correctly", async () => {
    const { getByText, getByTestId } = renderMainScreen();

    // Switch to calendar view
    fireEvent.press(getByText("Calendar"));

    // Add task from calendar
    const today = new Date();
    fireEvent.press(
      getByTestId("calendar-day-" + today.toISOString().split("T")[0])
    );

    await waitFor(() => {
      expect(getByPlaceholderText("Task Title")).toBeTruthy();
    });

    // Complete task addition
    fireEvent.changeText(getByPlaceholderText("Task Title"), "Calendar Task");
    fireEvent.press(getByText("Add Task"));

    await waitFor(() => {
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO tasks"),
        expect.arrayContaining(["Calendar Task"])
      );
    });
  });

  // Test notification error handling
  it("handles notification scheduling errors gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "error");
    Notifications.scheduleNotificationAsync.mockRejectedValueOnce(
      new Error("Notification Error")
    );

    const task = {
      id: 1,
      title: "Test Task",
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      status: "Pending"
    };

    mockDb.getAllAsync.mockResolvedValueOnce([task]);

    renderMainScreen();

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to schedule notification:",
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  // Test recurring task update scenarios
  it("handles recurring task updates correctly", async () => {
    const mockTask = {
      id: 1,
      title: "Recurring Task",
      description: "Test",
      dueDate: new Date().toISOString(),
      recurring: true,
      interval: "daily",
      status: "Pending",
      parentTaskId: 1
    };

    mockDb.getAllAsync.mockResolvedValueOnce([mockTask]);
    mockDb.getFirstAsync.mockResolvedValueOnce(mockTask);

    const { getByTestId, getByText } = renderMainScreen();

    await waitFor(() => {
      expect(getByTestId("task-item-1")).toBeTruthy();
    });

    fireEvent.press(getByTestId("task-item-1"));
    fireEvent.press(getByTestId("edit-task-1"));

    await waitFor(() => {
      const updateButton = getByText("Recurring Task");
      fireEvent.press(updateButton);
    });

    await waitFor(() => {
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE tasks"),
        expect.arrayContaining([
          expect.any(String),
          expect.any(String),
          "daily",
          1
        ])
      );
    });
  });

  // Test task list sorting and filtering
  it("sorts and filters tasks correctly", async () => {
    const tasks = [
      {
        id: 1,
        title: "Future Task",
        dueDate: new Date(Date.now() + 86400000 * 10).toISOString(),
        status: "Pending"
      },
      {
        id: 2,
        title: "Near Task",
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        status: "Pending"
      }
    ];

    mockDb.getAllAsync.mockResolvedValueOnce(tasks);

    const { getByText, queryByText } = renderMainScreen();

    await waitFor(() => {
      expect(getByText("Near Task")).toBeTruthy();
      expect(getByText("Future Task")).toBeTruthy();
    });

    // Test upcoming filter
    fireEvent.press(getByText("Show Upcoming"));

    await waitFor(() => {
      expect(getByText("Near Task")).toBeTruthy();
    });
  });

  // Test notification error handling
  it("handles notification scheduling errors gracefully", async () => {
    // Set up the error spy before the test
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    Notifications.scheduleNotificationAsync.mockRejectedValueOnce(
      new Error("Notification Error")
    );

    const task = {
      id: 1,
      title: "Test Task",
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      status: "Pending"
    };

    mockDb.getAllAsync.mockResolvedValueOnce([task]);

    renderMainScreen();

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        "Failed to schedule notification:",
        expect.any(Error)
      );
    });

    errorSpy.mockRestore();
  });

  // Test recurring task update scenarios
  it("handles recurring task updates correctly", async () => {
    const mockTask = {
      id: 1,
      title: "Recurring Task",
      description: "Test",
      dueDate: new Date().toISOString(),
      recurring: true,
      interval: "daily",
      status: "Pending",
      parentTaskId: 1
    };

    mockDb.getAllAsync.mockResolvedValueOnce([mockTask]);
    mockDb.getFirstAsync.mockResolvedValueOnce(mockTask);

    const { getByTestId, getByText } = renderMainScreen();

    await waitFor(() => {
      expect(getByTestId("task-item-1")).toBeTruthy();
    });

    fireEvent.press(getByTestId("task-item-1"));
    fireEvent.press(getByTestId("edit-task-1"));

    await waitFor(() => {
      const updateButton = getByText("Recurring Task");
      fireEvent.press(updateButton);
    });

    await waitFor(() => {
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE tasks"),
        expect.arrayContaining([
          expect.any(String),
          expect.any(String),
          "daily",
          1
        ])
      );
    });
  });

  // Test task list sorting and filtering
  it("sorts and filters tasks correctly", async () => {
    const tasks = [
      {
        id: 1,
        title: "Future Task",
        dueDate: new Date(Date.now() + 86400000 * 10).toISOString(),
        status: "Pending"
      },
      {
        id: 2,
        title: "Near Task",
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        status: "Pending"
      }
    ];

    mockDb.getAllAsync.mockResolvedValueOnce(tasks);

    const { getByText, queryByText } = renderMainScreen();

    await waitFor(() => {
      expect(getByText("Near Task")).toBeTruthy();
      expect(getByText("Future Task")).toBeTruthy();
    });

    // Test upcoming filter
    fireEvent.press(getByText("Show Upcoming"));

    await waitFor(() => {
      expect(getByText("Near Task")).toBeTruthy();
    });
  });

  // Test task status changes with history
  it("records task history correctly", async () => {
    const mockTask = {
      id: 1,
      title: "Test Task",
      status: "Pending"
    };

    mockDb.getAllAsync.mockResolvedValueOnce([mockTask]);
    mockDb.getFirstAsync.mockResolvedValueOnce(mockTask);

    const { getByTestId } = renderMainScreen();

    await waitFor(() => {
      expect(getByTestId("task-item-1")).toBeTruthy();
    });

    fireEvent.press(getByTestId("task-item-1"));
    fireEvent.press(getByTestId("complete-task-1"));

    await waitFor(() => {
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO history"),
        expect.arrayContaining([1, "Pending", "Done", expect.any(String)])
      );
    });
  });

  // Fix for the recurring task test
  it("creates a recurring task correctly", async () => {
    // Mock the database responses
    mockDb.runAsync.mockResolvedValueOnce({ insertId: 1 });

    const { getByTestId, getByText, getByPlaceholderText } = render(
      <ThemeProvider>
        <MainScreen />
      </ThemeProvider>
    );

    // Open add task modal
    fireEvent.press(getByTestId("floating-add-button"));

    // Fill in task details
    fireEvent.changeText(getByPlaceholderText("Task Title"), "Recurring Test");
    fireEvent.changeText(
      getByPlaceholderText("Task Description"),
      "Test Description"
    );

    // Wait for the switch to be available
    const recurringSwitch = getByTestId("recurring-switch");
    fireEvent.press(recurringSwitch);

    // Wait for the picker to be available and select interval
    const picker = getByTestId("interval-picker");
    fireEvent(picker, "onValueChange", "daily");

    // Save the task
    fireEvent.press(getByText("Add Task"));

    await waitFor(() => {
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO tasks"),
        expect.arrayContaining([
          "Recurring Test",
          "Test Description",
          expect.any(String),
          1,
          "daily",
          "Pending",
          null
        ])
      );
    });
  });

  // Fix for date and time selection test
  it("handles date and time selection correctly", async () => {
    const { getByTestId, getByText } = render(
      <ThemeProvider>
        <MainScreen />
      </ThemeProvider>
    );

    fireEvent.press(getByTestId("floating-add-button"));

    // Wait for modal to open
    await waitFor(() => {
      expect(getByText("Add Task")).toBeTruthy();
    });

    const testDate = new Date(2024, 0, 1); // January 1, 2024

    const datePicker = getByTestId("date-picker");
    fireEvent(datePicker, "onChange", {
      nativeEvent: { timestamp: testDate.getTime() }
    });

    await waitFor(() => {
      fireEvent.press(getByText("Select Due Time"));
    });

    const testTime = new Date(2024, 0, 1, 14, 30); // 2:30 PM

    await act(async () => {
      const timePicker = getByTestId("time-picker");
      fireEvent(timePicker, "onChange", {
        nativeEvent: { timestamp: testTime.getTime() }
      });
    });

    await waitFor(() => {
      expect(
        getByText("Selected Date and Time: 1/1/2024 2:30 PM")
      ).toBeTruthy();
    });
  });

  // Fix for calendar view interactions test
  it("handles calendar view interactions correctly", async () => {
    const { getByText, getByTestId, getByPlaceholderText } = render(
      <ThemeProvider>
        <MainScreen />
      </ThemeProvider>
    );

    // Switch to calendar view
    fireEvent.press(getByText("Calendar"));
    // Format today's date for the testID
    const today = new Date();
    const dateString = today.toISOString().split("T")[0];

    await waitFor(() => {
      const calendarDay = getByTestId(`calendar-day-${dateString}`);
      fireEvent.press(calendarDay);
    });

    // Verify modal opens and complete task addition
    await waitFor(() => {
      const titleInput = getByPlaceholderText("Task Title");
      fireEvent.changeText(titleInput, "Calendar Task");
      fireEvent.press(getByText("Add Task"));
    });

    await waitFor(() => {
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO tasks"),
        expect.arrayContaining(["Calendar Task"])
      );
    });
  });

  // Fix for notification error handling
  it("handles notification scheduling errors gracefully", async () => {
    // Set up the error spy before the test
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    Notifications.scheduleNotificationAsync.mockRejectedValueOnce(
      new Error("Notification Error")
    );

    const task = {
      id: 1,
      title: "Test Task",
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      status: "Pending"
    };

    mockDb.getAllAsync.mockResolvedValueOnce([task]);

    render(
      <ThemeProvider>
        <MainScreen />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        "Failed to schedule notification:",
        expect.any(Error)
      );
    });
  });

  // Fix for notification error handling
  it("handles notification scheduling errors gracefully", async () => {
    // Set up the error spy before the test
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    Notifications.scheduleNotificationAsync.mockRejectedValueOnce(
      new Error("Notification Error")
    );

    const task = {
      id: 1,
      title: "Test Task",
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      status: "Pending"
    };

    mockDb.getAllAsync.mockResolvedValueOnce([task]);

    render(
      <ThemeProvider>
        <MainScreen />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        "Failed to schedule notification:",
        expect.any(Error)
      );
    });
  });
});
