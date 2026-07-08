import React from "react";
import { AppStateProvider, useAppState } from "./context/AppContext.jsx";
import PipelineRail from "./components/PipelineRail.jsx";
import UploadStep from "./components/UploadStep.jsx";
import TargetStep from "./components/TargetStep.jsx";
import EDAStep from "./components/EDAStep.jsx";
import TrainStep from "./components/TrainStep.jsx";
import CompareStep from "./components/CompareStep.jsx";
import PredictStep from "./components/PredictStep.jsx";

const STEP_COMPONENTS = [UploadStep, TargetStep, EDAStep, TrainStep, CompareStep, PredictStep];

function Shell() {
  const { step, setStep, dataset, targetInfo, trainResult } = useAppState();

  // The furthest step the user is allowed to jump back to, based on what
  // data is already available in state.
  let maxReachable = 0;
  if (dataset) maxReachable = 1;
  if (targetInfo) maxReachable = 2;
  if (trainResult) maxReachable = 5;
  // The step the user is currently viewing is always reachable, even if
  // upstream state markers haven't "caught up" yet (e.g. right after
  // pressing Continue on the EDA step before training has run).
  maxReachable = Math.max(maxReachable, step);

  const StepComponent = STEP_COMPONENTS[step];

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-8 lg:flex gap-12">
        <PipelineRail currentStep={step} maxReachableStep={maxReachable} onJump={setStep} />
        <main className="flex-1 min-w-0 pb-24 animate-fade-in-up">
          <StepComponent />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <Shell />
    </AppStateProvider>
  );
}
