# Sentiment Analysis API with FastAPI

## 📄 Overview

This project is a **Sentiment Analysis API** built using **FastAPI**. The API processes uploaded text data, performs sentiment analysis using **VADER (Valence Aware Dictionary and sEntiment Reasoner)**, and returns detailed sentiment scores and classifications.
Application hosted on Render cloud platform: https://hanabi-2.onrender.com/

## ✨ Features

- **User Authentication**: Secures the API with Basic HTTP authentication.
- **File Upload Support**: Accepts multiple file formats:
  - CSV
  - Excel
  - JSON
  - TXT
- **Sentiment Analysis**:
  - Outputs sentiment scores (`Positive`, `Negative`, `Neutral`, `Compound`).
  - Classifies text into `Positive`, `Negative`, or `Neutral` sentiment.
  - Provides confidence scores.
- **Timestamp Parsing**: Extracts and formats `date` and `time` from a `timestamp` column, if present.
- **CORS Support**: Enables seamless integration with frontend applications.
- **Custom Error Handling**: Offers detailed error messages for unsupported formats or invalid inputs.

## 🚀 API Endpoints

### 1️⃣ `/login` (POST)
- **Description**: Authenticates the user with Basic HTTP credentials.
- **Request**:
  ```json
  {
    "username": "-",
    "password": "-"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Login successful"
  }
  ```

### 2️⃣ `/analyze` (POST)
- **Description**: Performs sentiment analysis on uploaded text data.
- **Authentication**: Requires valid credentials.
- **Request**:
  - File upload (CSV, Excel, JSON, or TXT).
- **Response**: Returns sentiment analysis results in the following format:
  ```json
  [
    {
      "id": 1,
      "date": "2024-12-30",
      "time": "12:34:56",
      "text": "Sample text",
      "sentiment_label": "Positive",
      "sentiment_confidence": 0.85
    },
  ]
  ```

## 🛠️ Setup Instructions

### Prerequisites
- Python 3.8+
- pip (Python package manager)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Hanabi.git
   cd Hanabi
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

4. Access the API at:
   ```
   http://127.0.0.1:8000
   ```
   Or access the application hosted on Render cloud platform: https://hanabi-2.onrender.com/
## 🧪 Testing the API

1. Use tools like **Postman** or **cURL** to test the endpoints.
2. For `/analyze`, upload a file containing a `text` column with the text data to analyze.

## 📂 File Upload Formats

- **CSV**: Requires a `text` column.
- **Excel**: Requires a `text` column.
- **JSON**: Should contain a `text` key.
- **TXT**: Each line is treated as a separate text entry.

## 🧑‍💻 Built With

- **FastAPI**: Web framework for building APIs.
- **VADER**: Sentiment analysis tool for text.
- **Pandas**: Data manipulation and processing.
- **CORS Middleware**: Enables cross-origin requests.

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙌 Acknowledgments

Special thanks to the creators of **FastAPI**, **VADER**, and **Pandas** for their amazing tools!
