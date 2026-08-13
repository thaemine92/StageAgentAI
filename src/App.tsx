import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetRequest from './pages/ResetRequest';
import ResetConfirm from './pages/ResetConfirm';
import DashboardPage from './pages/DashboardPage';
import PatientDetailsPage from './pages/PatientDetailsPage';
import AppointmentDetailsPage from './pages/AppointmentDetailsPage';
import ChatPage from './pages/ChatPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetRequest />} />
      <Route path="/reset-password/confirm" element={<ResetConfirm />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/patients/:id" element={<PatientDetailsPage />} />
      <Route path="/rendezvous/:id" element={<AppointmentDetailsPage />} />
      <Route path="/chat" element={<ChatPage />} />
    </Routes>
  );
}

export default App;