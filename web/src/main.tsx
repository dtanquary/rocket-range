import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import RocketRange from "@/components/rocket-range";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RocketRange />
  </StrictMode>,
);
