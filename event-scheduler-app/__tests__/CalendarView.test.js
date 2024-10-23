// CalendarView.test.js
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
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
    expect(getByText("Test Description")).toBeTruthy();
    expect(getByText("Due:")).toBeTruthy();
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
});
