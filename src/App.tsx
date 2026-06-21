import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout/Layout";
import VehicleList from "@/pages/VehicleList/VehicleList";
import VehicleDetail from "@/pages/VehicleDetail/VehicleDetail";
import AnomalyList from "@/pages/AnomalyList/AnomalyList";
import { useAnomalyStore } from "@/store/anomalyStore";

export default function App() {
  const initFromStorage = useAnomalyStore((s) => s.initFromStorage);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/vehicles" replace />} />
          <Route path="vehicles" element={<VehicleList />} />
          <Route path="vehicles/:id" element={<VehicleDetail />} />
          <Route path="anomalies" element={<AnomalyList />} />
          <Route path="*" element={<Navigate to="/vehicles" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
