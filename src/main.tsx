import { createRoot } from "react-dom/client";
import App from "./App";
createRoot(document.getElementById("root")!).render(<App />);
// Deferred telemetry is isolated from React and the simulation.
void import("./analytics/client")
  .then(({ startAnalytics }) => startAnalytics())
  .catch(() => {});
