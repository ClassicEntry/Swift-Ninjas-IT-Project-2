import React from "react";
import { render } from "@testing-library/react-native";
import CalendarView from "../app_components/CalendarView";

describe("CalendarView", () => {
  it("renders correctly", () => {
    const mockTasks = [
      {
        id: 1,
        title: "Test Task",
        dueDate: "2024-10-16T00:00:00.000Z",
        status: "pending",
      },
    ];
    const { getByText } = render(
      <CalendarView
        tasks={mockTasks}
        onUpdateTask={() => {}}
        onDeleteTask={() => {}}
        onAddTask={() => {}}
      />
    );

    expect(getByText("Today")).toBeTruthy();
  });
});
