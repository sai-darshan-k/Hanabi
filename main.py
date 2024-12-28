import logging
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import io

# Set up logging
logging.basicConfig(level=logging.DEBUG)

app = FastAPI()

# Middleware for CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication
security = HTTPBasic()

def authenticate(credentials: HTTPBasicCredentials = Depends(security)):
    if credentials.username != "admin" or credentials.password != "password":
        raise HTTPException(status_code=401, detail="Unauthorized")
    return credentials.username

# Sentiment Analysis Model
analyzer = SentimentIntensityAnalyzer()

@app.post("/login")
async def login(credentials: HTTPBasicCredentials = Depends(security)):
    if credentials.username != "admin" or credentials.password != "password":
        raise HTTPException(status_code=401, detail="Unauthorized")
    return {"message": "Login successful"}

@app.post("/analyze", dependencies=[Depends(authenticate)])
async def analyze_sentiment(file: UploadFile = File(...)):
    try:
        # Log the incoming file details
        logging.debug(f"Received file: {file.filename}")
        
        # Read CSV file
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))

        # Log the first few rows of the CSV
        logging.debug(f"CSV data: {df.head()}")

        # Check if 'text' and 'timestamp' columns exist
        if 'text' not in df.columns or 'timestamp' not in df.columns:
            raise HTTPException(status_code=400, detail="CSV must contain 'text' and 'timestamp' columns.")
        
        # Perform sentiment analysis
        df['sentiment'] = df['text'].apply(lambda x: analyzer.polarity_scores(x)['compound'])
        df['sentiment_label'] = df['sentiment'].apply(
            lambda score: 'Positive' if score > 0 else 'Negative' if score < 0 else 'Neutral'
        )
        
        # Adjust sentiment confidence: if negative sentiment, make it negative
        df['sentiment_confidence'] = df['sentiment'].apply(
            lambda x: x if x >= 0 else -abs(x)
        )
        
        # Split the timestamp into date and time
        df['date'] = pd.to_datetime(df['timestamp']).dt.date
        df['time'] = pd.to_datetime(df['timestamp']).dt.time

        # Generate ID column (starting from 1)
        df['id'] = df.index + 1  # ID starts from 1

        # Log the sentiment analysis results
        logging.debug(f"Sentiment results: {df[['id', 'date', 'time', 'text', 'sentiment_label', 'sentiment_confidence']].head()}")

        # Return results as a list of dictionaries
        return df[['id', 'date', 'time', 'text', 'sentiment_label', 'sentiment_confidence']].to_dict(orient='records')

    except Exception as e:
        logging.error(f"Error processing file: {e}")
        raise HTTPException(status_code=500, detail=str(e))
