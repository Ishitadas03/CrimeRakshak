import os
import sys
from dotenv import load_dotenv

# Add current dir to path to allow absolute imports within the package
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.ingestion.logger import get_logger
from backend.ingestion.postgres_loader import PostgresLoader
from backend.ingestion.neo4j_loader import Neo4jLoader
from backend.ingestion.synthetic_generator import SyntheticGenerator

logger = get_logger("main_ingest")

def main():
    load_dotenv()
    
    pg_uri = os.getenv("POSTGRES_URI", "postgresql://user:password@localhost:5432/crimerakshak")
    if pg_uri:
        pg_uri = pg_uri.replace("?pgbouncer=true&", "?").replace("?pgbouncer=true", "").replace("&pgbouncer=true", "")
    neo4j_uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    neo4j_user = os.getenv("NEO4J_USER", "neo4j")
    neo4j_pass = os.getenv("NEO4J_PASSWORD", "password")
    
    datasets_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "datasets")
    district_csv = os.path.join(datasets_dir, "02_district_wise_reported_cases.csv")
    
    logger.info("Starting Data Ingestion Pipeline")
    
    # 1. PostgreSQL Ingestion
    pg_loader = PostgresLoader(pg_uri)
    try:
        pg_loader.connect()
        if os.path.exists(district_csv):
            pg_loader.load_district_wise_data(district_csv)
        else:
            logger.warning(f"Dataset not found: {district_csv}")
    except Exception as e:
        logger.error(f"PostgreSQL pipeline failed: {e}")
    finally:
        pg_loader.close()
        
    # 2. Neo4j Ingestion & Synthetic Generation
    use_neo4j = os.getenv("USE_NEO4J", "true").lower() == "true"
    if use_neo4j:
        n4j_loader = Neo4jLoader(neo4j_uri, neo4j_user, neo4j_pass)
        try:
            n4j_loader.connect()
            if os.path.exists(district_csv):
                n4j_loader.load_base_graph_from_csv(district_csv)
                
            # 3. Synthetic Data
            synth_gen = SyntheticGenerator(n4j_loader.driver)
            synth_gen.generate_synthetic_graph(num_persons=100, num_firs=30)
            
        except Exception as e:
            logger.error(f"Neo4j pipeline failed: {e}")
        finally:
            n4j_loader.close()
    else:
        logger.info("Neo4j pipeline skipped (USE_NEO4J=False).")
        
    logger.info("Data Ingestion Pipeline Completed.")

if __name__ == "__main__":
    main()
