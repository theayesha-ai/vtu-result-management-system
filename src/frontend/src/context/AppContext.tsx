/**
 * AppContext — stores authenticated student data in memory (no localStorage).
 * Cleared on logout or page reload, which is intentional for security.
 */
import type React from "react";
import { createContext, useContext, useState } from "react";
import type { StudentResults } from "../types";

interface AppContextValue {
  studentResults: StudentResults | null;
  setStudentResults: (results: StudentResults | null) => void;
  isAdminLoggedIn: boolean;
  setIsAdminLoggedIn: (val: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [studentResults, setStudentResults] = useState<StudentResults | null>(
    null,
  );
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  return (
    <AppContext.Provider
      value={{
        studentResults,
        setStudentResults,
        isAdminLoggedIn,
        setIsAdminLoggedIn,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
