import React, { createContext, useState, useContext } from "react";

// Define the default theme with all properties
const defaultTheme = {
  primary: "#006064",
  background: "#F2F2F7",
  text: "#000000",
  taskBackground: "#FFFFFF",
  accent: "#34C759",
  error: "#FF3B30",
  warning: "#FF9500",
  success: "#30D158"
};

const ThemeContext = createContext({
  theme: defaultTheme,
  setTheme: () => {}
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(defaultTheme);

  // Ensure all theme properties are present when setting a new theme
  const setThemeWithDefaults = (newTheme) => {
    setTheme({
      ...defaultTheme, // Fallback values
      ...newTheme // New theme values override defaults
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeWithDefaults }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
