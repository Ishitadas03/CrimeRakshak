import pandas as pd
from neo4j import GraphDatabase
from .logger import get_logger

logger = get_logger(__name__)

class Neo4jLoader:
    def __init__(self, uri, username, password):
        self.uri = uri
        self.username = username
        self.password = password
        self.driver = None

    def connect(self):
        try:
            self.driver = GraphDatabase.driver(
                self.uri,
                auth=(self.username, self.password),
                max_connection_lifetime=200,
                keep_alive=True
            )
            logger.info("Connected to Neo4j successfully.")
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {e}")
            raise

    def close(self):
        if self.driver:
            self.driver.close()
            logger.info("Closed Neo4j connection.")

    def load_base_graph_from_csv(self, csv_path):
        """Loads districts, crime categories, and their aggregate relations into Neo4j"""
        if not self.driver:
            self.connect()
            
        logger.info(f"Loading base graph data from {csv_path}")
        df = pd.read_csv(csv_path)
        df = df.dropna(subset=['District'])
        
        districts = df['District'].unique().tolist()
        crime_heads = [col for col in df.columns if col not in ['District', 'Sl No']]
        
        with self.driver.session() as session:
            # Create Districts
            for dist in districts:
                session.execute_write(
                    self._merge_node, 
                    "District", 
                    "district_id", 
                    dist.replace(" ", "_").lower(), 
                    {"name": dist, "is_synthetic": False, "source": "KSP"}
                )
                
            # Create Crime Categories
            for head in crime_heads:
                session.execute_write(
                    self._merge_node, 
                    "CrimeCategory", 
                    "category_id", 
                    head.replace(" ", "_").lower(), 
                    {"name": head, "is_synthetic": False, "source": "KSP"}
                )
                
            # Create RECORDED_CRIME relationships
            relations = []
            for index, row in df.iterrows():
                dist_id = row['District'].replace(" ", "_").lower()
                for head in crime_heads:
                    val = row.get(head, 0)
                    if pd.notna(val) and val > 0:
                        cat_id = head.replace(" ", "_").lower()
                        relations.append({
                            "dist_id": dist_id,
                            "cat_id": cat_id,
                            "year": 2026,
                            "month": 1,
                            "count": int(val)
                        })
            
            # Write relationships in batches
            rels_created = 0
            batch_size = 200
            for i in range(0, len(relations), batch_size):
                batch = relations[i:i+batch_size]
                session.execute_write(self._create_crime_relations_batch, batch)
                rels_created += len(batch)
                        
            logger.info(f"Successfully created {rels_created} RECORDED_CRIME relationships in Neo4j.")

    @staticmethod
    def _merge_node(tx, label, id_key, id_val, properties):
        props_str = ", ".join([f"{k}: ${k}" for k in properties.keys()])
        query = f"MERGE (n:{label} {{{id_key}: $id_val}}) SET n += {{{props_str}}}"
        tx.run(query, id_val=id_val, **properties)

    @staticmethod
    def _create_crime_relations_batch(tx, batch):
        query = """
        UNWIND $batch AS item
        MATCH (d:District {district_id: item.dist_id})
        MATCH (c:CrimeCategory {category_id: item.cat_id})
        MERGE (d)-[r:RECORDED_CRIME {year: item.year, month: item.month}]->(c)
        SET r.count = item.count, r.is_synthetic = false
        """
        tx.run(query, batch=batch)
