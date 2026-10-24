import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./style.css";
// Safari exposes pinch gestures separately from Pointer Events.
// Keep ordinary single-finger scrolling and form interaction available.
for (const event of ["gesturestart", "gesturechange"]) {
  document.addEventListener(event, (gesture) => gesture.preventDefault(), {
    passive: false,
  });
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
