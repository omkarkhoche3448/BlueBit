import os
import pandas as pd
from sqlalchemy import create_engine, inspect
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Database connection string
NEON_CONNECTION_STRING = "cockroachdb://mihir:w0z0M4_TVJH0b42wxSnbaw@kaamdekho-9992.j77.aws-ap-south-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full"

def export_db_to_csv():
    """Export all tables in the database to CSV files."""
    
    try:
        # Create output directory if it doesn't exist
        output_dir = 'db_exports'
        os.makedirs(output_dir, exist_ok=True)
        
        # Connect to the database
        logging.info(f"Connecting to database...")
        engine = create_engine(NEON_CONNECTION_STRING)
        inspector = inspect(engine)
        
        # Get all table names
        table_names = inspector.get_table_names()
        logging.info(f"Found {len(table_names)} tables: {', '.join(table_names)}")
        
        # Export each table to CSV
        for table_name in table_names:
            try:
                logging.info(f"Exporting table: {table_name}")
                
                # Get column names to handle JSON columns properly
                columns = [col['name'] for col in inspector.get_columns(table_name)]
                
                # Use pandas to query and export the table
                query = f"SELECT * FROM {table_name}"
                df = pd.read_sql_query(query, engine)
                
                # Handle any potential JSON columns by converting to string
                for col in df.columns:
                    if df[col].dtype == 'object':
                        df[col] = df[col].astype(str)
                
                # Export to CSV
                csv_path = os.path.join(output_dir, f"{table_name}.csv")
                df.to_csv(csv_path, index=False)
                logging.info(f"Successfully exported {table_name} to {csv_path} ({len(df)} rows)")
                
                # Print sample data (first 5 rows)
                if not df.empty:
                    logging.info(f"Sample data from {table_name}:")
                    print(df.head().to_string())
                    print("-" * 80)
                
            except Exception as e:
                logging.error(f"Error exporting table {table_name}: {str(e)}")
        
        logging.info(f"Database export complete. CSV files are in the '{output_dir}' directory")
        
    except Exception as e:
        logging.error(f"Database connection error: {str(e)}")

if __name__ == "__main__":
    export_db_to_csv() 