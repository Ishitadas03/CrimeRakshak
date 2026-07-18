import os
import glob

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Simple regex to replace .session() with .session(database=os.getenv("NEO4J_DATABASE", "neo4j"))
    import re
    # Match driver.session() or self.driver.session()
    # Be careful not to replace already patched ones
    new_content = re.sub(
        r'(\w+)\.session\(\)', 
        r'\1.session(database=os.environ.get("NEO4J_DATABASE", "neo4j"))', 
        content
    )
    
    if new_content != content:
        # Add import os if not present
        if "import os" not in new_content:
            new_content = "import os\n" + new_content
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Patched {filepath}")

if __name__ == "__main__":
    for root, dirs, files in os.walk(r"c:\crime ai\CrimeRakshak\backend"):
        for file in files:
            if file.endswith(".py") and file != "patch_neo4j_db.py":
                patch_file(os.path.join(root, file))
