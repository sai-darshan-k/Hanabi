import logging
import pandas as pd
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.middleware.cors import CORSMiddleware
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import io
from starlette.requests import Request

#setlogging
logging.basicConfig(level=logging.DEBUG)

app = FastAPI()

#middleware for CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Authentication
security = HTTPBasic()

def authenticate(credentials: HTTPBasicCredentials = Depends(security)):
    if credentials.username != "sai" or credentials.password != "hanabi":
        raise HTTPException(status_code=401, detail="Unauthorized")
    return credentials.username

#Sentiment Analysis Model
analyzer = SentimentIntensityAnalyzer()

@app.middleware("https")
async def log_requests(request: Request, call_next):
    """ Log request method and path for debugging """
    logging.debug(f"Request method: {request.method}, Path: {request.url.path}")
    response = await call_next(request)
    return response

def read_file(file: UploadFile):
    """Utility function to read and parse different file types."""
    try:
        file_ext = file.filename.split('.')[-1].lower()
        
        if file_ext == "csv":
            return pd.read_csv(io.StringIO(file.file.read().decode("utf-8")))
        elif file_ext == "xlsx":
            return pd.read_excel(file.file)
        elif file_ext == "json":
            return pd.read_json(io.StringIO(file.file.read().decode("utf-8")))
        elif file_ext == "txt":
            lines = file.file.read().decode("utf-8").splitlines()
            return pd.DataFrame({"text": lines})
        else:
            raise ValueError("Unsupported file type")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

def get_detailed_sentiment(text):
    """
    Get detailed sentiment analysis with proper handling of negative values
    """
    # Get the full sentiment scores
    scores = analyzer.polarity_scores(str(text))
    
    # Extract the compound score
    compound = scores['compound']
    
    # Determine sentiment label
    if compound > 0:
        label = 'Positive'
    elif compound < 0:
        label = 'Negative'
    else:
        label = 'Neutral'
    
    # calulate confidence (absolute value of compound score)
    # This ensures we maintain the sign for visualization but have proper confidence
    confidence = compound 
    
    return {
        'compound': compound,
        'label': label,
        'confidence': confidence,
        'pos': scores['pos'],
        'neg': scores['neg'],
        'neu': scores['neu']
    }

@app.post("/analyze", dependencies=[Depends(authenticate)])
async def analyze_sentiment(file: UploadFile = File(...)):
    try:
        logging.debug(f"Received file: {file.filename}")
        
        df = read_file(file)
        logging.debug(f"Data preview: {df.head()}")

        if 'text' not in df.columns:
            raise HTTPException(status_code=400, detail="Input must contain a 'text' column.")

        # Apply detailed sentiment analysis
        sentiment_results = df['text'].apply(get_detailed_sentiment)
        
        # Extract results into separate columns
        df['sentiment'] = sentiment_results.apply(lambda x: x['compound'])
        df['sentiment_label'] = sentiment_results.apply(lambda x: x['label'])
        df['sentiment_confidence'] = sentiment_results.apply(lambda x: x['confidence'])
        
        # Handle timestamp
        if 'timestamp' in df.columns:
            try:
                df['date'] = pd.to_datetime(df['timestamp'], errors='coerce').dt.date.fillna("N/A")
                df['time'] = pd.to_datetime(df['timestamp'], errors='coerce').dt.time.fillna("N/A")
            except Exception as e:
                logging.warning(f"Failed to parse timestamp: {e}")
                df['date'] = "N/A"
                df['time'] = "N/A"
        else:
            df['date'] = "N/A"
            df['time'] = "N/A"

        # Generate ID column if not present
        if 'id' not in df.columns:
            df['id'] = df.index + 1

        # Log the sentiment analysis results
        logging.debug(f"Sentiment results: {df[['id', 'date', 'time', 'text', 'sentiment_label', 'sentiment_confidence']].head()}")

        # Return results including new detailed sentiment scores
        return df[[ 
            'id', 'date', 'time', 'text',
            'sentiment_label', 'sentiment_confidence'
        ]].to_dict(orient='records')

    except Exception as e:
        logging.error(f"Error processing file: {e}")
        raise HTTPException(status_code=500, detail=str(e))
