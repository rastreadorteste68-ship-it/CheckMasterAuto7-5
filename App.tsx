
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './src/components/Layout';
import { AuthProvider, useAuth } from './src/services/authContext';
import Dashboard from './src/pages/Dashboard';
import Finance from './src/pages/Finance';
import Login from './src/pages/Login';
import Services from './src/pages/Services';
import Agenda from './src/pages/Agenda';
import Clients from './src/pages/Clients';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="finance" element={<Finance />} />
            <Route path="services" element={<Services />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="clients" element={<Clients />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
