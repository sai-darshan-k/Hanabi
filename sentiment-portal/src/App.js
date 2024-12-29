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

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!file) {
      setErrorMessage('Please select a CSV file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('https://hanabi1.onrender.com/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSentimentResults(response.data);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage('Failed to fetch sentiment analysis. Please try again.');
    }
  };

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

  const chartData = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [
      {
        data: getSentimentData().map(item => item.value),
        backgroundColor: ['#36A2EB', '#FF5733', '#FFEB3B'],
      },
    ],
  };

  if (!isAuthenticated) {
    return <LoginPage setIsAuthenticated={setIsAuthenticated} />;
  }

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
  );
}

export default App;
