import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "./store";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Processing from "./pages/Processing";
import ReviewEdit from "./pages/ReviewEdit";
import ApproveShare from "./pages/ApproveShare";
import Settings from "./pages/Settings";
import PatientView from "./pages/PatientView";
import "./index.css";

function DarkModeSync({ children }) {
  const { darkMode } = useApp();
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);
  return children;
}

function App() {
  return (
    <AppProvider>
      <DarkModeSync>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/report/:id/processing" element={<Processing />} />
            <Route path="/report/:id/review" element={<ReviewEdit />} />
            <Route path="/report/:id/approved" element={<ApproveShare />} />
            <Route path="/patient/:id" element={<PatientView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </DarkModeSync>
    </AppProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
