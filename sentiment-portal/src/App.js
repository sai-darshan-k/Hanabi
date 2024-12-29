import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement } from 'chart.js';
import LoginPage from './LoginPage';
import './App.css';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import logo from './logo.png';  // Ensure the path is correct

ChartJS.register(ArcElement, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement);

function App() {
  const [file, setFile] = useState(null);
  const [sentimentResults, setSentimentResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pieChartRef = useRef(null);
  const trendChartRef = useRef(null);

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
          'Authorization': 'Basic ' + btoa('admin:password'),
        },
      });

      setSentimentResults(response.data);
      console.log("Raw sentiment results:", response.data); // Debug log
      setErrorMessage('');
    } catch (error) {
      setErrorMessage('Failed to fetch sentiment analysis. Please try again.');
    }
  };

  const downloadTableAsExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(sentimentResults);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sentiment Results");
    XLSX.writeFile(workbook, "sentiment_results.xlsx");
  };

  const downloadChartAsImage = (chartRef, filename) => {
    html2canvas(chartRef.current.canvas).then(canvas => {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = filename;
      link.click();
    });
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

  const getSentimentTrendData = () => {
    if (!sentimentResults) return { labels: [], datasets: [] };

    const sortedResults = [...sentimentResults].sort((a, b) => {
      if (a.date === "N/A" || b.date === "N/A") return 0;
      return new Date(a.date) - new Date(b.date);
    });

    const dateGroups = {};
    sortedResults.forEach(result => {
      if (result.date === "N/A") return;
      
      if (!dateGroups[result.date]) {
        dateGroups[result.date] = [];
      }
      
      let sentimentValue = result.sentiment_confidence;
      if (result.sentiment_label === 'Negative') {
        sentimentValue = -Math.abs(result.sentiment_confidence);
      } else if (result.sentiment_label === 'Neutral') {
        sentimentValue = 0;
      }
      
      dateGroups[result.date].push(sentimentValue);
    });

    const labels = Object.keys(dateGroups).sort();
    const sentimentValues = labels.map(date => {
      const values = dateGroups[date];
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      return Number(average.toFixed(4));
    });

    return {
      labels,
      datasets: [{
        label: 'Sentiment Trend',
        data: sentimentValues,
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: sentimentValues.map(value => 
          value > 0 ? '#4CAF50' : 
          value < 0 ? '#F44336' : 
          '#FFC107'
        ),
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 2,
      }]
    };
  };

  const chartData = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [{
      data: getSentimentData().map(item => item.value),
      backgroundColor: ['#4CAF50', '#F44336', '#FFC107'],
    }],
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        min: -1,
        max: 1,
        grid: {
          color: (context) => context.tick.value === 0 ? '#000000' : '#E5E5E5',
          lineWidth: (context) => context.tick.value === 0 ? 2 : 1,
        },
        ticks: {
          callback: (value) => value.toFixed(2),
          stepSize: 0.2,
          color: '#666666',
        },
        title: {
          display: true,
          text: 'Sentiment Score',
          color: '#666666',
        }
      },
      x: {
        grid: {
          color: '#E5E5E5',
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          color: '#666666',
        },
        title: {
          display: true,
          text: 'Date',
          color: '#666666',
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          boxWidth: 20,
          color: '#666666',
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const score = context.raw;
            const sentiment = score > 0 ? 'Positive' : score < 0 ? 'Negative' : 'Neutral';
            return `Sentiment: ${sentiment} (${score.toFixed(4)})`;
          }
        }
      }
    }
  };

  if (!isAuthenticated) {
    return <LoginPage setIsAuthenticated={setIsAuthenticated} />;
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} alt="Logo" className="header-image" />
        <h1>AI-Powered Sentiment Analysis</h1>
      </header>

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

          <button onClick={downloadTableAsExcel}>Download Table as Excel</button>

          <div className="chart-container">
            <h3>Sentiment Distribution</h3>
            <Pie data={chartData} ref={pieChartRef} />
            <button onClick={() => downloadChartAsImage(pieChartRef, 'sentiment_distribution.png')}>Download Pie Chart</button>
          </div>

          <div className="trend-chart-container" style={{ height: '400px' }}>
            <h3>Sentiment Trend Over Time</h3>
            <Line data={getSentimentTrendData()} options={trendOptions} ref={trendChartRef} />
            <button onClick={() => downloadChartAsImage(trendChartRef, 'sentiment_trend.png')}>Download Trend Chart</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
