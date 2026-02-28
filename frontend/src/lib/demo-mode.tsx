"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface DemoModeContextType {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
}

const DemoModeContext = createContext<DemoModeContextType>({
  isDemoMode: false,
  toggleDemoMode: () => {},
});

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);

  return (
    <DemoModeContext.Provider
      value={{
        isDemoMode,
        toggleDemoMode: () => setIsDemoMode((prev) => !prev),
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  return useContext(DemoModeContext);
}
