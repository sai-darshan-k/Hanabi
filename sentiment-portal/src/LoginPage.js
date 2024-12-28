import React, { useState } from 'react';
import axiosInstance from './axiosConfig';

function LoginPage({ setIsAuthenticated }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axiosInstance.post('/login', {}, {
        headers: {
          'Authorization': 'Basic ' + btoa(`${username}:${password}`),
        },
      });
      if (response.status === 200) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      setErrorMessage('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="button" onClick={handleLogin}>Login</button>
      </form>
      {errorMessage && <div className="error">{errorMessage}</div>}
    </div>
  );
}

export default LoginPage;
