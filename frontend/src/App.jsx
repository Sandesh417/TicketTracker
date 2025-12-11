import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import PrivateRoute from "./routes/PrivateRoute";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import PlantPage from "./pages/MasterDataPages/PlantPage";
import ProjectPage from "./pages/MasterDataPages/ProjectPage";
import ShopPage from "./pages/MasterDataPages/ShopPage";
import LinePage from "./pages/MasterDataPages/LinePage";
import MachinePage from "./pages/MasterDataPages/MachinePage";
import UserAccessManagement from "./pages/UserAccessManagement";
import TicketHistoryPage from "./pages/TicketHistoryPage.jsx"; 

function MainLayout() {
  const [selected, setSelected] = useState("dashboard");

  return (
    <div className="flex h-screen">
      <Sidebar selected={selected} onSelect={setSelected} />
      <main className="flex-grow p-6 overflow-auto bg-gray-50">
        <Routes>
          <Route path="dashboard" element={<HomePage />} />
          <Route path="plant" element={<PlantPage />} />
          <Route path="project" element={<ProjectPage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="line" element={<LinePage />} />
          <Route path="machine" element={<MachinePage />} />
          <Route path="useraccess" element={<UserAccessManagement />} />
          <Route path="ticket-history" element={<TicketHistoryPage />} /> {/* <--- ADD THIS LINE */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/" element={<LoginPage />} />
        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
