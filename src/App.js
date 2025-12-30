import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MapView from './pages/MapView';
import HelloProtected from './pages/HelloProtected';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/auth/login" replace />} />
                <Route path="/auth/register" element={<Register />} />
                <Route path="/auth/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/map" element={<MapView />} />
                <Route path="/hello" element={<HelloProtected />} />
                <Route path="*" element={<Navigate to="/auth/login" replace />} />
            </Routes>
        </Router>
    );
}

export default App;