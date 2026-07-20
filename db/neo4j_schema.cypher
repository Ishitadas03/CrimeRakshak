// Constraints and Indexes for Performance
CREATE CONSTRAINT ON (d:District) ASSERT d.district_id IS UNIQUE;
CREATE CONSTRAINT ON (c:CrimeCategory) ASSERT c.category_id IS UNIQUE;
CREATE CONSTRAINT ON (p:Person) ASSERT p.person_id IS UNIQUE;
CREATE CONSTRAINT ON (f:FIR) ASSERT f.fir_id IS UNIQUE;
CREATE CONSTRAINT ON (b:BankAccount) ASSERT b.account_no IS UNIQUE;
CREATE CONSTRAINT ON (ph:PhoneNumber) ASSERT ph.phone_no IS UNIQUE;

// 1. Graph Schema for Aggregate Data
// Nodes: District, CrimeCategory, TimePeriod
// Relationship: RECORDED_CRIME

// Example of Aggregate Crime Data ingestion structure:
// (d:District {name: "Bagalkot"})-[:RECORDED_CRIME {year: 2026, month: 1, count: 5}]->(c:CrimeCategory {name: "Murder"})


// 2. Synthetic Graph Schema for Criminal Network & Financial Link Analysis
// This schema supports deep link analysis but requires synthetic/transactional data to populate

// Nodes:
// - Person: Suspects, victims, associates
// - FIR: Case registrations
// - BankAccount: Accounts linked to persons
// - PhoneNumber: Telecom details
// - Location: Associated geographical spots (e.g., crime scene)

// Relationships (Edges):

// Criminal Networks:
// (p1:Person)-[:ASSOCIATES_WITH {relation_type: "Friend/Family/Gang", since: "2024"}]->(p2:Person)
// (p:Person)-[:ACCUSED_IN {role: "Prime Suspect", arrested: true}]->(f:FIR)
// (p:Person)-[:VICTIM_IN]->(f:FIR)
// (p:Person)-[:WITNESS_IN]->(f:FIR)

// Telecom Link Analysis:
// (p:Person)-[:OWNS_PHONE]->(ph:PhoneNumber)
// (ph1:PhoneNumber)-[:CALLED {timestamp: "2026-01-15T14:30:00", duration_sec: 120, location_tower: "Tower_A"}]->(ph2:PhoneNumber)

// Financial Link Analysis:
// (p:Person)-[:OWNS_ACCOUNT]->(b:BankAccount)
// (b1:BankAccount)-[:TRANSFERRED_TO {transaction_id: "TXN123", amount: 50000, date: "2026-01-15", method: "NEFT"}]->(b2:BankAccount)
// (b1:BankAccount)-[:RECEIVED_FROM {transaction_id: "TXN124", amount: 20000, date: "2026-01-16", method: "UPI"}]->(b2:BankAccount)

// Geolocation/Spatial:
// (f:FIR)-[:OCCURRED_AT]->(l:Location {latitude: 12.9716, longitude: 77.5946, address: "MG Road"})
// (d:District)-[:CONTAINS]->(l:Location)
