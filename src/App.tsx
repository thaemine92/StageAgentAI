import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetRequest from './pages/ResetRequest';
import ResetConfirm from './pages/ResetConfirm';
import DashboardPage from './pages/DashboardPage';
import PatientDetailsPage from './pages/PatientDetailsPage';
import AppointmentDetailsPage from './pages/AppointmentDetailsPage';
import ChatPage from './pages/ChatPage';
import PatientsPage from './pages/PatientsPage';
import PatientSpacePage from './pages/PatientSpacePage';
import Chatbot from './components/Chatbot';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetRequest />} />
        <Route path="/reset-password/confirm" element={<ResetConfirm />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/patients" element={<PatientsPage />} />
        <Route path="/patients/:id" element={<PatientDetailsPage />} />
        <Route path="/rendezvous/:id" element={<AppointmentDetailsPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/mon-espace" element={<PatientSpacePage />} />
      </Routes>
      <Chatbot />
    </>
  );
}

export default App;