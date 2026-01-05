import React from 'react';
import ReactDOM from 'react-dom/client';
import 'antd/dist/reset.css';  // 添加这行
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

reportWebVitals();