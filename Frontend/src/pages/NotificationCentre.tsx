import { useState, useEffect } from 'react';
import Sidebar from '../ui_elements/SideBar';
import { fetchNotifications, markNotificationAsRead, deleteNotification } from '../services/api';
import '../CSS Files/DashBoard.css';

interface Notification {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

const NotificationCentre = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id);
      setNotifications(notifications.filter(notif => notif.id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleString();
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <div className="header-section" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="title-area">
            <h1 style={{ color: '#000000', margin: '0 0 5px 0' }}>Notification Centre</h1>
            <p style={{ color: '#666666', margin: 0 }}>Stay updated on your team's activity</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '800px' }}>
          {loading ? (
            <p>loading notifs</p>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666666' }}>
              <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>No notifications.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id}
                style={{
                  backgroundColor: notif.is_read ? '#f9f9f9' : '#ffffff',
                  border: '1px solid #cccccc',
                  padding: '20px',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  opacity: notif.is_read ? 0.7 : 1,
                  boxShadow: notif.is_read ? 'none' : '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <div>
                  <p style={{ margin: '0 0 8px 0', color: '#000000', fontWeight: notif.is_read ? 'normal' : 'bold' }}>
                    {notif.message}
                  </p>
                  <span style={{ fontSize: '0.8rem', color: '#666666' }}>{formatTime(notif.created_at)}</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {!notif.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      style={{
                        backgroundColor: '#3498db',
                        color: '#ffffff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      Read
                    </button>
                  )}
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
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCentre;