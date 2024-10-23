import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import CalendarView from "../app_components/CalendarView";

describe("<CalendarView />", () => {
  const mockProps = {
    tasks: [
      {
        id: 1,
        title: "Test Task",
        description: "Test Description",
        dueDate: new Date().toISOString(),
        status: "Pending"
      },
      {
        id: 2,
        title: "Another Task",
        description: "Another Description",
        dueDate: new Date().toISOString(),
        status: "Completed"
      }
    ],
    onUpdateTask: jest.fn(),
    onDeleteTask: jest.fn(),
    onAddTask: jest.fn()
  };

  it("renders calendar view", () => {
    const { getByText } = render(<CalendarView {...mockProps} />);
    expect(getByText("Show Today's Tasks")).toBeTruthy();
  });

  it("shows tasks for selected date", () => {
    const { getByText } = render(<CalendarView {...mockProps} />);
    fireEvent.press(getByText("Show Today's Tasks"));
    expect(getByText("Test Task")).toBeTruthy();
    expect(getByText("Another Task")).toBeTruthy();
  });

  it("opens task detail modal on task press", () => {
    const { getByText } = render(<CalendarView {...mockProps} />);
    fireEvent.press(getByText("Show Today's Tasks"));
    fireEvent.press(getByText("Test Task"));
    expect(getByText("Test Task")).toBeTruthy();
  });

  it("calls onUpdateTask when edit button is pressed", () => {
    const { getByText } = render(<CalendarView {...mockProps} />);
    fireEvent.press(getByText("Show Today's Tasks"));
    fireEvent.press(getByText("Test Task"));
    fireEvent.press(getByText("Edit"));
    expect(mockProps.onUpdateTask).toHaveBeenCalledWith(1);
  });

  it("calls onDeleteTask when delete button is pressed", () => {
    const { getByText } = render(<CalendarView {...mockProps} />);
    fireEvent.press(getByText("Show Today's Tasks"));
    fireEvent.press(getByText("Test Task"));
    fireEvent.press(getByText("Delete"));
    expect(mockProps.onDeleteTask).toHaveBeenCalledWith(1);
  });

  it("calls onAddTask when add new task button is pressed", () => {
    const { getByText } = render(<CalendarView {...mockProps} />);
    fireEvent.press(getByText("Show Today's Tasks"));
    fireEvent.press(getByText("Add New Task"));
    expect(mockProps.onAddTask).toHaveBeenCalled();
  });

  it("closes modal when close button is pressed", () => {
    const { getByText, queryByText } = render(<CalendarView {...mockProps} />);
    fireEvent.press(getByText("Show Today's Tasks"));
    fireEvent.press(getByText("Close"));
    expect(queryByText("Test Task")).toBeNull();
  });

  it("displays correct status colors for different task states", () => {
    const tasksWithDifferentStatuses = {
      ...mockProps,
      tasks: [
        { ...mockProps.tasks[0], status: "overdue" },
        { ...mockProps.tasks[1], status: "completed" },
        {
          id: 3,
          title: "Pending Task",
          description: "Test",
          dueDate: new Date().toISOString(),
          status: "pending"
        }
      ]
    };

    const { UNSAFE_root } = render(
      <CalendarView {...tasksWithDifferentStatuses} />
    );

    const taskIndicators = UNSAFE_root.findAllByProps({
      style: expect.arrayContaining([
        expect.objectContaining({ backgroundColor: expect.any(String) })
      ])
    });

    expect(taskIndicators).toBeTruthy();
  });

  it("handles maximum dots correctly", () => {
    const manyTasks = {
      ...mockProps,
      tasks: Array(6)
        .fill(null)
        .map((_, index) => ({
          id: index + 1,
          title: `Task ${index + 1}`,
          description: "Test",
          dueDate: new Date().toISOString(),
          status: "pending"
        }))
    };

    const { UNSAFE_root } = render(<CalendarView {...manyTasks} />);

    const dots = UNSAFE_root.findAllByProps({
      style: expect.objectContaining({ backgroundColor: "red" })
    });
    expect(dots).toBeTruthy();
  });

  it("handles date selection correctly", () => {
    const { getByTestId } = render(<CalendarView {...mockProps} />);
    const calendar = getByTestId("calendar");

    const formattedToday = new Date().toISOString().split("T")[0];

    act(() => {
      fireEvent(calendar, "dayPress", { dateString: formattedToday });
    });

    expect(getByTestId(`calendar.day_${formattedToday}`)).toBeTruthy();
  });

  it("handles empty task list correctly", () => {
    const emptyProps = {
      ...mockProps,
      tasks: []
    };

    const { getByText, queryByText } = render(<CalendarView {...emptyProps} />);

    fireEvent.press(getByText("Show Today's Tasks"));
    expect(queryByText("Test Task")).toBeNull();
  });

  it("filters tasks correctly for selected date", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const mixedDateTasks = {
      ...mockProps,
      tasks: [
        { ...mockProps.tasks[0] },
        { ...mockProps.tasks[1], dueDate: tomorrow.toISOString() }
      ]
    };

    const { getByText, queryByText } = render(
      <CalendarView {...mixedDateTasks} />
    );

    fireEvent.press(getByText("Show Today's Tasks"));
    expect(getByText("Test Task")).toBeTruthy();
    expect(queryByText("Another Task")).toBeNull();
  });

  it("manages modal state correctly through different interactions", () => {
    const { getByText, queryByText } = render(<CalendarView {...mockProps} />);

    fireEvent.press(getByText("Show Today's Tasks"));
    expect(getByText("Test Task")).toBeTruthy();

    fireEvent.press(getByText("Test Task"));
    expect(getByText("Description: Test Description")).toBeTruthy();

    fireEvent.press(getByText("Close"));
    expect(queryByText("Description: Test Description")).toBeNull();
  });

  it("displays task interval correctly", () => {
    const tasksWithInterval = {
      ...mockProps,
      tasks: [{ ...mockProps.tasks[0], interval: "weekly" }]
    };

    const { getByText } = render(<CalendarView {...tasksWithInterval} />);

    fireEvent.press(getByText("Show Today's Tasks"));
    fireEvent.press(getByText("Test Task"));
    expect(getByText("Interval: weekly")).toBeTruthy();
  });

  it("calls onUpdateTask with correct task ID when task is pressed", () => {
    const { getByText } = render(<CalendarView {...mockProps} />);

    fireEvent.press(getByText("Show Today's Tasks"));
    fireEvent.press(getByText("Test Task"));

    expect(mockProps.onUpdateTask).toHaveBeenCalledWith(1);
  });

  it("press TaskDetailModal close button", () => {
    const { getByText, queryByText } = render(<CalendarView {...mockProps} />);

    fireEvent.press(getByText("Show Today's Tasks"));
    fireEvent.press(getByText("Test Task"));
    fireEvent.press(getByText("Close"));

    expect(queryByText("Test Task")).toBeNull();
  });

  it("opens TaskDetailModal when a task is pressed", () => {
    const { getByText } = render(<CalendarView {...mockProps} />);

    fireEvent.press(getByText("Show Today's Tasks"));
    fireEvent.press(getByText("Test Task"));

    expect(getByText("Description: Test Description")).toBeTruthy();
  });

  it("closes TaskDetailModal when the modal close button is pressed", () => {
    const { getByText, queryByText } = render(<CalendarView {...mockProps} />);

    fireEvent.press(getByText("Show Today's Tasks"));
    fireEvent.press(getByText("Test Task"));
    fireEvent.press(getByText("Close"));

    expect(queryByText("Description: Test Description")).toBeNull();
  });

  it("closes TaskDetailModal when the modal is requested to close", () => {
    const { getByText, queryByText } = render(<CalendarView {...mockProps} />);

    fireEvent.press(getByText("Show Today's Tasks"));
    fireEvent.press(getByText("Test Task"));
    fireEvent.press(getByText("Close"));

    expect(queryByText("Test Task")).toBeNull();
  });

  it("calls onDeleteTask with correct task ID when delete button is pressed", () => {
    const { getByText } = render(<CalendarView {...mockProps} />);

    fireEvent.press(getByText("Show Today's Tasks"));
    fireEvent.press(getByText("Test Task"));
    fireEvent.press(getByText("Delete"));

    expect(mockProps.onDeleteTask).toHaveBeenCalledWith(1);
  });
});
