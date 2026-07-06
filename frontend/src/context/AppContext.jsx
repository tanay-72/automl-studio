import React, { createContext, useContext, useState } from "react";

const AppStateContext = createContext(null);

/**
 * Holds everything that needs to flow between wizard steps: the session id
 * returned by the backend after upload, the chosen target/task type, and
 * the training results used by the Compare and Predict steps.
 */
export function AppStateProvider({ children }) {
  const [step, setStep] = useState(0);
  const [dataset, setDataset] = useState(null); // upload response
  const [targetInfo, setTargetInfo] = useState(null); // select-target response
  const [trainResult, setTrainResult] = useState(null); // train response

  const reset = () => {
    setStep(0);
    setDataset(null);
    setTargetInfo(null);
    setTrainResult(null);
  };

  const value = {
    step,
    setStep,
    dataset,
    setDataset,
    targetInfo,
    setTargetInfo,
    trainResult,
    setTrainResult,
    reset,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
