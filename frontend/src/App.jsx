import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import Home from './pages/Home';
import Register from './pages/Register';
import ReporterDashboard from './pages/ReporterDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PrivateRoute from './auth/PrivateRoute';
import Navbar from './components/Navbar';
import ReporterLogin from './pages/ReporterLogin';
import AdminLogin from './pages/AdminLogin';
import NotFound from './pages/NotFound';
import NewsDetail from './pages/NewsDetail';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoginDashboard from './pages/LoginDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <ToastContainer
          theme="colored"
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          className="toast-black-red"
        />
        <Routes>
          <Route path="/login" element={<LoginDashboard />} />
          <Route path="/" element={<Home />} />
          <Route path="/reporter" element={
            <PrivateRoute role="reporter">
              <ReporterDashboard />
            </PrivateRoute>
          } />
          <Route path="/admin" element={
            <PrivateRoute role="admin">
              <AdminDashboard />
            </PrivateRoute>
          } />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
