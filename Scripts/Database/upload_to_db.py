df = pd.read_csv(r"D:\DEPI_Project\Datasets\Dataset\real_estate_dataset.csv")
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv
import os

# Ensure this script is run as a module from the project root so package
# imports resolve consistently.
if __name__ == "__main__" and (__package__ is None or __package__ == ""):
    print("Please run as module from project root:\n  python -m Scripts.Database.upload_to_db")
    raise SystemExit(1)

# 1. Load environment variables
load_dotenv()

# 2. Load your cleaned dataset
df = pd.read_csv(r"D:\DEPI_Project\Datasets\Dataset\real_estate_dataset.csv")

# 3. Clean column names (PostgreSQL-safe)
df.columns = (
    df.columns
    .str.strip()
    .str.lower()
    .str.replace(" ", "_")
    .str.replace("(", "")
    .str.replace(")", "")
    .str.replace("/", "_")
)

# 4. Connect to your Neon DB
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

# 5. Upload the data
df.to_sql('real_estate_data', engine, if_exists='append', index=False, schema='public')

print(f"Uploaded {len(df)} records successfully to 'real_estate_data' table!")
