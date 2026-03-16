import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectBoard from './pages/ProjectBoard';
import Team from './pages/Team';
import ProjectDetails from './pages/ProjectDetails';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import ArchivedProjects from './pages/ArchivedProjects';
import NotificationCentre from './pages/NotificationCentre';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/project/:projectId" element={<ProjectDetails />} />
        <Route path="/board/:boardId" element={<ProjectBoard />} />
        <Route path="/notifications" element={<NotificationCentre />} />
        <Route path="/team" element={<Team />} />
        <Route path="/archived" element={<ArchivedProjects />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
};
export default App;