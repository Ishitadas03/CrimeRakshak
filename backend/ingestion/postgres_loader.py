import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from .logger import get_logger

logger = get_logger(__name__)

class PostgresLoader:
    def __init__(self, uri):
        self.uri = uri
        self.conn = None

    def connect(self):
        try:
            self.conn = psycopg2.connect(self.uri)
            logger.info("Connected to PostgreSQL successfully.")
        except Exception as e:
            logger.error(f"Failed to connect to PostgreSQL: {e}")
            raise

    def close(self):
        if self.conn:
            self.conn.close()
            logger.info("Closed PostgreSQL connection.")

    def load_district_wise_data(self, csv_path):
        """Loads district and crime statistics from 02_district_wise_reported_cases.csv"""
        if not self.conn:
            self.connect()
            
        logger.info(f"Loading district data from {csv_path}")
        df = pd.read_csv(csv_path)
        
        # Clean dataframe
        df = df.dropna(subset=['District'])
        
        cursor = self.conn.cursor()
        
        try:
            # 1. Load Dimensions: Districts
            districts = df['District'].unique().tolist()
            district_records = [(d, 'Unknown') for d in districts] # Default range to Unknown
            
            execute_values(
                cursor,
                "INSERT INTO dim_district (district_name, range_name) VALUES %s ON CONFLICT (district_name) DO NOTHING",
                district_records
            )
            
            # Fetch district mapping
            cursor.execute("SELECT district_id, district_name FROM dim_district")
            district_map = {name: id for id, name in cursor.fetchall()}
            
            # 2. Load Dimensions: Crime Categories
            # Skipping 'District', 'Sl No' etc
            crime_heads = [col for col in df.columns if col not in ['District', 'Sl No']]
            category_records = [(head, 'General') for head in crime_heads]
            
            # We need to handle this differently since we don't have UNIQUE constraint on major_head in schema
            for head in crime_heads:
                cursor.execute(
                    "INSERT INTO dim_crime_category (major_head, minor_head) SELECT %s, %s WHERE NOT EXISTS (SELECT 1 FROM dim_crime_category WHERE major_head = %s)",
                    (head, 'General', head)
                )
            
            # Fetch category mapping
            cursor.execute("SELECT category_id, major_head FROM dim_crime_category")
            category_map = {name: id for id, name in cursor.fetchall()}
            
            # 3. Load Dimensions: Time (assuming static Jan 2026 for this dataset based on file context)
            cursor.execute("INSERT INTO dim_time (year, month) VALUES (2026, 1) ON CONFLICT (year, month) DO NOTHING")
            cursor.execute("SELECT time_id FROM dim_time WHERE year = 2026 AND month = 1")
            time_id = cursor.fetchone()[0]
            
            # 4. Load Facts
            fact_records = []
            for index, row in df.iterrows():
                dist_id = district_map.get(row['District'])
                if not dist_id:
                    continue
                    
                for head in crime_heads:
                    cat_id = category_map.get(head)
                    if not cat_id:
                        continue
                    
                    val = row.get(head, 0)
                    if pd.notna(val) and val > 0:
                        fact_records.append((dist_id, cat_id, time_id, int(val)))
            
            execute_values(
                cursor,
                "INSERT INTO fact_crime_stats (district_id, category_id, time_id, reported_cases) VALUES %s ON CONFLICT (district_id, category_id, time_id) DO UPDATE SET reported_cases = EXCLUDED.reported_cases",
                fact_records
            )
            
            self.conn.commit()
            logger.info(f"Successfully loaded {len(fact_records)} fact records into PostgreSQL.")
            
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Error loading to PostgreSQL: {e}")
            raise
        finally:
            cursor.close()
