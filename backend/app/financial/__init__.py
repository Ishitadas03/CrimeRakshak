"""Financial Crime & Transaction Link Analysis module (Feature 7).

Money-trail, transaction-network, and suspicious-activity analysis over the
existing Neo4j graph. Reuses the Graph module's Neo4j connection manager and
node serialization, plus the shared JWT auth, RBAC middleware, and audit logging.
"""
