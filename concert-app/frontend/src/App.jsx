import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import BookingPage from './pages/BookingPage';
import Confirmation from './pages/Confirmation';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Navbar />
        <Routes>
          <Route path="/"             element={<Home />} />
          <Route path="/concert/:id"  element={<BookingPage />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="/dashboard"    element={<Dashboard />} />
          <Route path="/admin"        element={<Admin />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
