import { useState } from 'react';
import Sidebar from '../ui_elements/SideBar';
import '../CSS Files/DashBoard.css';
interface Notification {
  id: number;
  message: string;
  timeAgo: string;
}
const initialNotifications: Notification[] = [
  { 
    id: 1, 
    message: "John Smith assigned you a new task in 'Task Management App'", 
    timeAgo: "10m ago"
  }
];
const NotificationCentre = () => {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const handleDelete = (id: number) => {
    const updated = notifications.filter(notif => notif.id !== id);
    setNotifications(updated);
  };
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        
        <div className="header-section" style={{ marginBottom: '30px' }}>
          <div className="title-area">
            <h1 style={{ color: '#000000', margin: '0 0 5px 0' }}>Notification Centre</h1>
            <p style={{ color: '#666666', margin: 0 }}>Stay updated on your team's activity</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '800px' }}>
          
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666666' }}>
              <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>No notifications.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cccccc',
                  padding: '20px',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <p style={{ margin: '0 0 8px 0', color: '#000000', fontWeight: 'bold' }}>
                    {notif.message}
                  </p>
                  <span style={{ fontSize: '0.8rem', color: '#666666' }}>{notif.timeAgo}</span>
                </div>
                <button
                  onClick={() => handleDelete(notif.id)}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#cc0000',
                    border: '1px solid #ffcccc',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
export default NotificationCentre;