import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import myLogo from './assets/mylogo.png';
import './App.css';

import Register from './pages/Register';
import Login from './pages/Login';
import HelloProtected from './pages/HelloProtected';

function Home() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={myLogo} className="App-logo" alt="logo" />
        <p>
          <Link className="App-link" to="/register">
            Go to Register
          </Link>
        </p>
        <p>
          <Link className="App-link" to="/login">
            Go to Login
          </Link>
        </p>
        <p>
          <Link className="App-link" to="/hello">
            Go to Protected Hello
          </Link>
        </p>
      </header>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/hello" element={<HelloProtected />} />
      </Routes>
    </Router>
  );
}

export default App;
