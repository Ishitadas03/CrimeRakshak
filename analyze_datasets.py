import pandas as pd
import glob
import json
import os

datasets_dir = r"c:\Users\ishit\CrimeRakshak\datasets"
csv_files = glob.glob(os.path.join(datasets_dir, "*.csv"))

analysis_result = {}

for file in csv_files:
    filename = os.path.basename(file)
    try:
        
        df = pd.read_csv(file)
        
        columns = {}
        duplicate_columns = df.columns[df.columns.duplicated()].tolist()
        
        for col in df.columns:
            # We skip duplicate names to avoid error in dict comprehension, though we logged them
            if col not in columns:
                missing_count = int(df[col].isnull().sum())
                dtype = str(df[col].dtype)
                sample = df[col].dropna().head(3).tolist()
                columns[col] = {
                    "dtype": dtype,
                    "missing_count": missing_count,
                    "sample": sample
                }
                
        analysis_result[filename] = {
            "num_rows": len(df),
            "num_columns": len(df.columns),
            "duplicate_columns": duplicate_columns,
            "columns": columns
        }
    except Exception as e:
        analysis_result[filename] = {"error": str(e)}

with open(r"c:\Users\ishit\CrimeRakshak\analysis_output.json", "w") as f:
    json.dump(analysis_result, f, indent=4)
print("Analysis complete. Saved to analysis_output.json")
