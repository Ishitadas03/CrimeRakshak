from faker import Faker
import random
import uuid
from .logger import get_logger

logger = get_logger(__name__)

class SyntheticGenerator:
    def __init__(self, neo4j_driver):
        self.driver = neo4j_driver
        self.fake = Faker('en_IN')
        
    def generate_synthetic_graph(self, num_persons=100, num_firs=30):
        """Generates synthetic nodes and relationships for testing Graph Intelligence"""
        logger.info(f"Generating synthetic graph data: {num_persons} Persons, {num_firs} FIRs")
        
        persons = []
        firs = []
        bank_accounts = []
        phones = []
        
        # 1. Generate local data structures
        for _ in range(num_persons):
            person = {
                "person_id": str(uuid.uuid4()),
                "name": self.fake.name(),
                "age": random.randint(18, 65),
                "is_synthetic": True,
                "synthetic_source": "faker"
            }
            persons.append(person)
            
        for _ in range(num_firs):
            fir = {
                "fir_id": f"FIR-{self.fake.year()}-{random.randint(100, 9999)}",
                "date": str(self.fake.date_between(start_date='-2y', end_date='today')),
                "is_synthetic": True,
                "synthetic_source": "faker"
            }
            firs.append(fir)
            
        for _ in range(int(num_persons * 1.5)):
            acc = {
                "account_no": self.fake.bban(),
                "bank_name": self.fake.company(),
                "is_synthetic": True,
                "synthetic_source": "faker"
            }
            bank_accounts.append(acc)
            
            phone = {
                "phone_no": self.fake.phone_number(),
                "provider": self.fake.company(),
                "is_synthetic": True,
                "synthetic_source": "faker"
            }
            phones.append(phone)
            
        # 2. Write in a single write transaction
        def _write_tx(tx):
            # Persons
            for p in persons:
                self._merge_synthetic_node(tx, "Person", "person_id", p)
            # FIRs
            for f in firs:
                self._merge_synthetic_node(tx, "FIR", "fir_id", f)
            # Accounts
            for acc in bank_accounts:
                self._merge_synthetic_node(tx, "BankAccount", "account_no", acc)
            # Phones
            for phone in phones:
                self._merge_synthetic_node(tx, "PhoneNumber", "phone_no", phone)
                
            rels_created = 0
            
            # ASSOCIATES_WITH
            for _ in range(num_persons * 2):
                p1 = random.choice(persons)
                p2 = random.choice(persons)
                if p1 != p2:
                    props = {"relation_type": random.choice(["Friend", "Family", "Gang"]), "is_synthetic": True, "synthetic_source": "faker"}
                    self._create_relation(tx, "Person", "person_id", p1["person_id"], "Person", "person_id", p2["person_id"], "ASSOCIATES_WITH", props)
                    rels_created += 1
                    
            # ACCUSED_IN / VICTIM_IN
            for p in persons:
                if random.random() > 0.7:
                    f = random.choice(firs)
                    props = {"role": "Suspect", "is_synthetic": True, "synthetic_source": "faker"}
                    self._create_relation(tx, "Person", "person_id", p["person_id"], "FIR", "fir_id", f["fir_id"], "ACCUSED_IN", props)
                    rels_created += 1
                    
            # OWNS_ACCOUNT & TRANSFERRED_TO
            for p in persons:
                acc = random.choice(bank_accounts)
                props = {"is_synthetic": True, "synthetic_source": "faker"}
                self._create_relation(tx, "Person", "person_id", p["person_id"], "BankAccount", "account_no", acc["account_no"], "OWNS_ACCOUNT", props)
                rels_created += 1
                
            for _ in range(num_persons * 3):
                a1 = random.choice(bank_accounts)
                a2 = random.choice(bank_accounts)
                if a1 != a2:
                    props = {
                        "amount": random.randint(1000, 500000),
                        "date": str(self.fake.date_this_year()),
                        "is_synthetic": True,
                        "synthetic_source": "faker"
                    }
                    self._create_relation(tx, "BankAccount", "account_no", a1["account_no"], "BankAccount", "account_no", a2["account_no"], "TRANSFERRED_TO", props)
                    rels_created += 1
            return rels_created

        with self.driver.session() as session:
            rels_created = session.execute_write(_write_tx)
            logger.info(f"Successfully generated {rels_created} synthetic relationships.")
            
    @staticmethod
    def _merge_synthetic_node(tx, label, id_key, properties):
        id_val = properties[id_key]
        props_str = ", ".join([f"{k}: ${k}" for k in properties.keys()])
        query = f"MERGE (n:{label} {{{id_key}: $id_val}}) SET n += {{{props_str}}}"
        tx.run(query, id_val=id_val, **properties)
        
    @staticmethod
    def _create_relation(tx, l1, id_key1, id_val1, l2, id_key2, id_val2, rel_type, properties):
        props_str = ", ".join([f"{k}: ${k}" for k in properties.keys()])
        query = f"""
        MATCH (a:{l1} {{{id_key1}: $id_val1}})
        MATCH (b:{l2} {{{id_key2}: $id_val2}})
        MERGE (a)-[r:{rel_type}]->(b)
        SET r += {{{props_str}}}
        """
        tx.run(query, id_val1=id_val1, id_val2=id_val2, **properties)
