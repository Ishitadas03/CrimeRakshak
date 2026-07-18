import os
from neo4j import GraphDatabase

uri = "neo4j+s://48e4aef7.databases.neo4j.io"
password = "UwaMuvsHGufvHCib2MWw4TdK6sEx4VeRTVXmeHsIPq4"

print("Testing with user: neo4j")
try:
    driver1 = GraphDatabase.driver(uri, auth=("neo4j", password))
    driver1.verify_connectivity()
    print("SUCCESS with user: neo4j")
except Exception as e:
    print(f"FAILED with user neo4j: {e}")

print("\nTesting with user: 48e4aef7")
try:
    driver2 = GraphDatabase.driver(uri, auth=("48e4aef7", password))
    driver2.verify_connectivity()
    print("SUCCESS with user: 48e4aef7")
except Exception as e:
    print(f"FAILED with user 48e4aef7: {e}")

print("\nTesting with neo4j+ssc:// and user: neo4j")
try:
    driver3 = GraphDatabase.driver(uri.replace("neo4j+s://", "neo4j+ssc://"), auth=("neo4j", password))
    driver3.verify_connectivity()
    print("SUCCESS with neo4j+ssc://")
except Exception as e:
    print(f"FAILED with neo4j+ssc://: {e}")
