import os
import re
import sys
import time
from dotenv import load_dotenv

# Try loading .env from potential locations
env_loaded = False
for env_path in [".env", "backend/.env", "../.env", "app/.env"]:
    if os.path.exists(env_path):
        load_dotenv(env_path)
        print(f"Loaded environment variables from: {os.path.abspath(env_path)}")
        env_loaded = True
        break

if not env_loaded:
    load_dotenv()  # Fallback to default load
    print("Attempted to load default environment variables.")

postgres_uri = os.getenv("POSTGRES_URI", "")
if postgres_uri:
    postgres_uri = postgres_uri.replace("?pgbouncer=true&", "?").replace("?pgbouncer=true", "").replace("&pgbouncer=true", "")

neo4j_uri = os.getenv("NEO4J_URI")
neo4j_user = os.getenv("NEO4J_USER", "neo4j")
neo4j_password = os.getenv("NEO4J_PASSWORD", "password")

print(f"PostgreSQL URI: {postgres_uri}")
print(f"Neo4j URI: {neo4j_uri} (User: {neo4j_user})")

def init_postgres():
    if not postgres_uri:
        print("ERROR: POSTGRES_URI environment variable is not set.")
        return False

    # Find db/schema.sql
    schema_path = None
    for path in ["db/schema.sql", "../db/schema.sql", "../../db/schema.sql"]:
        if os.path.exists(path):
            schema_path = path
            break

    if not schema_path:
        print("ERROR: Could not locate db/schema.sql file.")
        return False

    print(f"Reading PostgreSQL schema from {schema_path}...")
    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    # Retry connection loop (useful if Docker container is still starting up)
    max_retries = 15
    retry_delay = 2
    conn = None

    print("Connecting to PostgreSQL...")
    for i in range(max_retries):
        try:
            import psycopg2
            conn = psycopg2.connect(postgres_uri)
            print("Connected to PostgreSQL successfully.")
            break
        except Exception as e:
            print(f"PostgreSQL connection attempt {i+1}/{max_retries} failed: {e}")
            if i < max_retries - 1:
                time.sleep(retry_delay)
            else:
                print("ERROR: Max retries exceeded. Could not connect to PostgreSQL.")
                return False

    try:
        cursor = conn.cursor()
        print("Executing PostgreSQL schema...")
        cursor.execute(schema_sql)
        conn.commit()
        print("PostgreSQL schema initialized successfully.")
        cursor.close()
        return True
    except Exception as e:
        conn.rollback()
        print(f"ERROR: Failed to execute PostgreSQL schema: {e}")
        return False
    finally:
        if conn:
            conn.close()

def init_neo4j():
    if not neo4j_uri:
        print("ERROR: NEO4J_URI environment variable is not set.")
        return False

    # Find db/neo4j_schema.cypher
    cypher_path = None
    for path in ["db/neo4j_schema.cypher", "../db/neo4j_schema.cypher", "../../db/neo4j_schema.cypher"]:
        if os.path.exists(path):
            cypher_path = path
            break

    if not cypher_path:
        print("ERROR: Could not locate db/neo4j_schema.cypher file.")
        return False

    print(f"Reading Neo4j schema from {cypher_path}...")
    with open(cypher_path, "r", encoding="utf-8") as f:
        cypher_content = f.read()

    # Parse Cypher file into individual queries
    statements = []
    # Split by semicolon to get individual queries
    raw_statements = cypher_content.split(";")
    for stmt in raw_statements:
        # Remove comments and clean up whitespace
        lines = []
        for line in stmt.split("\n"):
            line_clean = line.strip()
            if line_clean.startswith("//") or not line_clean:
                continue
            lines.append(line_clean)
        stmt_clean = " ".join(lines).strip()
        if stmt_clean:
            statements.append(stmt_clean)

    # Translate constraints from Neo4j 4.x syntax to Neo4j 5 syntax:
    # "CREATE CONSTRAINT ON (x:Label) ASSERT x.prop IS UNIQUE" ->
    # "CREATE CONSTRAINT IF NOT EXISTS FOR (x:Label) REQUIRE x.prop IS UNIQUE"
    constraint_pattern = re.compile(
        r"CREATE\s+CONSTRAINT\s+ON\s*\(\s*(\w+)\s*:\s*(\w+)\s*\)\s*ASSERT\s+\1\.(\w+)\s+IS\s+UNIQUE",
        re.IGNORECASE
    )

    translated_statements = []
    for stmt in statements:
        if "CREATE CONSTRAINT" in stmt:
            new_stmt = constraint_pattern.sub(
                r"CREATE CONSTRAINT IF NOT EXISTS FOR (\1:\2) REQUIRE \1.\3 IS UNIQUE",
                stmt
            )
            print(f"Translating constraint query:\n  Original: {stmt}\n  Translated: {new_stmt}")
            translated_statements.append(new_stmt)
        else:
            translated_statements.append(stmt)

    # Retry connection loop
    max_retries = 15
    retry_delay = 2
    driver = None

    print("Connecting to Neo4j...")
    for i in range(max_retries):
        try:
            from neo4j import GraphDatabase
            driver = GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password))
            # Test connectivity
            driver.verify_connectivity()
            print("Connected to Neo4j successfully.")
            break
        except Exception as e:
            print(f"Neo4j connection attempt {i+1}/{max_retries} failed: {e}")
            if driver:
                driver.close()
                driver = None
            if i < max_retries - 1:
                time.sleep(retry_delay)
            else:
                print("ERROR: Max retries exceeded. Could not connect to Neo4j.")
                return False

    try:
        with driver.session() as session:
            print("Executing Neo4j constraints & schema queries...")
            for query in translated_statements:
                print(f"Executing Cypher: {query}")
                session.run(query)
            print("Neo4j constraints initialized successfully.")
            return True
    except Exception as e:
        print(f"ERROR: Failed to execute Neo4j schema: {e}")
        return False
    finally:
        if driver:
            driver.close()

def main():
    print("========================================")
    print("CrimeRakshak Database Initialization Helper")
    print("========================================")
    
    postgres_success = init_postgres()
    print("----------------------------------------")
    
    use_neo4j = os.getenv("USE_NEO4J", "true").lower() == "true"
    if use_neo4j:
        neo4j_success = init_neo4j()
    else:
        print("Neo4j database initialization skipped (USE_NEO4J=False).")
        neo4j_success = True
        
    print("========================================")
    
    if postgres_success and neo4j_success:
        print("SUCCESS: Database initialization completed successfully!")
        sys.exit(0)
    else:
        print("ERROR: Database initialization failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()
