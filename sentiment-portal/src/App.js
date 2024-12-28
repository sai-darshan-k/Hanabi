import React, { useState } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import LoginPage from './LoginPage';
import './App.css';

ChartJS.register(ArcElement, Tooltip, Legend);

function App() {
  const [file, setFile] = useState(null);
  const [sentimentResults, setSentimentResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setErrorMessage(''); // Clear any previous error messages
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!file) {
      setErrorMessage('Please select a CSV file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('https://hanabi-backend.onrender.com/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': 'Basic ' + btoa('admin:password'), // Replace with your credentials
        },
      });

      setSentimentResults(response.data);
      setErrorMessage('');
    } catch (error) {
      // Improved error handling
      if (error.response) {
        // Server responded with a status other than 200
        setErrorMessage(`Error: ${error.response.data.detail || 'Failed to fetch sentiment analysis. Please try again.'}`);
      } else if (error.request) {
        // Request was made but no response received
        setErrorMessage('Error: No response from server. Please check your connection.');
      } else {
        // Something else happened
        setErrorMessage(`Error: ${error.message}`);
      }
    }
  };

  // Prepare sentiment data for the chart
  const getSentimentData = () => {
    if (!sentimentResults) return [];
    
    const sentimentCounts = { Positive: 0, Negative: 0, Neutral: 0 };
    
    sentimentResults.forEach(result => {
      sentimentCounts[result.sentiment_label]++;
    });
    
    return [
      { label: 'Positive', value: sentimentCounts.Positive },
      { label: 'Negative', value: sentimentCounts.Negative },
      { label: 'Neutral', value: sentimentCounts.Neutral },
    ];
  };

  // Chart data configuration
  const chartData = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [
      {
        data: getSentimentData().map(item => item.value),
        backgroundColor: ['#36A2EB', '#FF5733', '#FFEB3B'],
      },
    ],
  };

  // Render login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage setIsAuthenticated={setIsAuthenticated} />;
  }

  // Main application render
  return (
    <div className="App">
      <h1>Sentiment Analysis</h1>
      <input type="file" accept=".csv" onChange={handleFileChange} />
      <button onClick={handleFileUpload}>Upload CSV</button>

      {errorMessage && <div className="error">{errorMessage}</div>}

      {sentimentResults && (
        <div className="results-container">
          <h2>Sentiment Results:</h2>
          <table className="results-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Time</th>
                <th>Text</th>
                <th>Sentiment</th>
                <th>Sentiment Confidence</th>
              </tr>
            </thead>
            <tbody>
              {sentimentResults.map((result, index) => (
                <tr key={index}>
                  <td>{result.id}</td>
                  <td>{result.date}</td>
                  <td>{result.time}</td>
                  <td>{result.text}</td>
                  <td>{result.sentiment_label}</td>
                  <td>{result.sentiment_confidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="chart-container">
            <Pie data={chartData} />
          </div>
        </div>
      )}
    </div>
);}
export default App;