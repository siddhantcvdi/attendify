import React, { createContext, useContext } from "react";

interface AppResetContextValue {
  resetApp: () => void;
}

const AppResetContext = createContext<AppResetContextValue>({ resetApp: () => {} });

export function AppResetProvider({
  children,
  onReset,
}: {
  children: React.ReactNode;
  onReset: () => void;
}) {
  return (
    <AppResetContext.Provider value={{ resetApp: onReset }}>
      {children}
    </AppResetContext.Provider>
  );
}

export function useAppReset() {
  return useContext(AppResetContext);
}
