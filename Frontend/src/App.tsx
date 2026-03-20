import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectBoard from './pages/ProjectBoard';
import Team from './pages/Team';
import AllowedWorkflows from './pages/AllowedWorkflows';
import ProjectDetails from './pages/ProjectDetails';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import ArchivedProjects from './pages/ArchivedProjects';
import NotificationCentre from './pages/NotificationCentre';
import ProtectedRoute from './ui_elements/ProtectedRoute';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/project/:projectId" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
        <Route path="/board/:boardId" element={<ProtectedRoute><ProjectBoard /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationCentre /></ProtectedRoute>} />
        <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
        <Route path="/board/:boardId/allowed-workflows" element={<ProtectedRoute><AllowedWorkflows /></ProtectedRoute>} />
        <Route path="/archived" element={<ProtectedRoute><ArchivedProjects /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
};
export default App;