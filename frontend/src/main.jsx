import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider, useSelector } from 'react-redux';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { store } from './redux/store';
import AppLayout from './layouts/AppLayout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import { Customers, Team, Reports, Settings, Portal } from './pages/Workspace';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
function Guard({ children, customer = false }) {
  const user = useSelector((s) => s.session.user);
  if (!user) return <Navigate to="/login" replace />;
  if (customer && user.role !== 'Customer') {
    return <Navigate to="/dashboard" replace />;
  }
  if (!customer && user.role === 'Customer') {
    return <Navigate to="/portal" replace />;
  }
  return children;
}
function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth register />} />
        <Route
          element={
            <Guard>
              <AppLayout />
            </Guard>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/team" element={<Team />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route
          element={
            <Guard customer>
              <AppLayout />
            </Guard>
          }
        >
          <Route path="/portal" element={<Portal />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster position="top-right" />
    </>
  );
}
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
