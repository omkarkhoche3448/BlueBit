import sqlite3
import os
import json
import pandas as pd
from datetime import datetime, timedelta, date

DB_PATH = 'jobs.db'

def json_serialize_helper(obj):
    """Helper function to serialize objects that json cannot handle by default"""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

def get_db_connection():
    """Create a connection to the SQLite database"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    return conn

def init_db():
    """Initialize the database with required tables"""
    conn = get_db_connection()
    
    # Create jobs table
    conn.execute('''
    CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        title TEXT,
        company TEXT,
        company_url TEXT,
        job_url TEXT,
        location TEXT,
        is_remote BOOLEAN,
        description TEXT,
        job_type TEXT,
        min_amount REAL,
        max_amount REAL,
        currency TEXT,
        date_posted TEXT,
        skills TEXT,
        job_level TEXT,
        company_industry TEXT,
        company_logo TEXT,
        raw_data TEXT,
        created_at TEXT,
        source TEXT
    )
    ''')
    
    # Create cache_status table to track when data was last scraped
    conn.execute('''
    CREATE TABLE IF NOT EXISTS cache_status (
        filter_key TEXT PRIMARY KEY,
        filter_value TEXT,
        last_updated TEXT
    )
    ''')
    
    conn.commit()
    conn.close()

def store_jobs(jobs_df, filter_key=None, filter_value=None):
    """Store scraped jobs in the database"""
    conn = get_db_connection()
    
    # Convert DataFrame to list of dictionaries
    jobs = jobs_df.replace({pd.NA: None}).to_dict(orient='records')
    
    for job in jobs:
        # Convert any complex objects to JSON strings
        job_data = {k: (json.dumps(v) if isinstance(v, (dict, list)) else v) 
                   for k, v in job.items()}
        
        # Extract specific fields for our schema
        job_entry = {
            'id': str(job.get('id', '')),
            'title': job.get('title', ''),
            'company': job.get('company', ''),
            'company_url': job.get('company_url', ''),
            'job_url': job.get('job_url', ''),
            'location': job.get('location', ''),
            'is_remote': bool(job.get('is_remote', False)),
            'description': job.get('description', ''),
            'job_type': job.get('job_type', ''),
            'min_amount': job.get('min_amount', 0),
            'max_amount': job.get('max_amount', 0),
            'currency': job.get('currency', ''),
            'date_posted': job.get('date_posted', ''),
            'skills': json.dumps(job.get('skills', [])) if isinstance(job.get('skills', []), list) else job.get('skills', ''),
            'job_level': job.get('job_level', ''),
            'company_industry': job.get('company_industry', ''),
            'company_logo': job.get('company_logo', ''),
            'raw_data': json.dumps(job_data, default=json_serialize_helper),
            'created_at': datetime.now().isoformat(),
            'source': 'scraper'
        }
        
        # Use INSERT OR REPLACE to update existing records
        placeholders = ', '.join(['?'] * len(job_entry))
        columns = ', '.join(job_entry.keys())
        values = tuple(job_entry.values())
        
        conn.execute(f'''
        INSERT OR REPLACE INTO jobs ({columns})
        VALUES ({placeholders})
        ''', values)
    
    # Update cache status
    if filter_key and filter_value:
        conn.execute('''
        INSERT OR REPLACE INTO cache_status (filter_key, filter_value, last_updated)
        VALUES (?, ?, ?)
        ''', (filter_key, json.dumps(filter_value, default=json_serialize_helper), datetime.now().isoformat()))
    
    conn.commit()
    conn.close()

def get_jobs(filters=None):
    """Retrieve jobs from database based on filters"""
    conn = get_db_connection()
    query = "SELECT * FROM jobs"
    params = []
    
    if filters:
        conditions = []
        
        if filters.get('searchTerm'):
            conditions.append("(title LIKE ? OR company LIKE ? OR description LIKE ?)")
            search_term = f"%{filters['searchTerm']}%"
            params.extend([search_term, search_term, search_term])
        
        if filters.get('location'):
            conditions.append("location LIKE ?")
            params.append(f"%{filters['location']}%")
        
        if filters.get('jobType'):
            conditions.append("job_type = ?")
            params.append(filters['jobType'])
        
        if filters.get('jobLevel'):
            conditions.append("job_level = ?")
            params.append(filters['jobLevel'])
        
        # Handle is_remote - convert to boolean
        is_remote = filters.get('isRemote')
        if isinstance(is_remote, bool):
            conditions.append("is_remote = ?")
            params.append(is_remote)
        elif isinstance(is_remote, str):
            if is_remote.lower() == 'true':
                conditions.append("is_remote = ?")
                params.append(True)
            elif is_remote.lower() == 'false':
                conditions.append("is_remote = ?")
                params.append(False)
        
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
    
    cursor = conn.execute(query, params)
    rows = cursor.fetchall()
    
    # Convert SQLite rows to list of dictionaries
    results = []
    for row in rows:
        job_dict = dict(row)
        
        # Parse JSON fields
        for field in ['skills', 'raw_data']:
            if job_dict.get(field):
                try:
                    job_dict[field] = json.loads(job_dict[field])
                except:
                    pass
        
        results.append(job_dict)
    
    conn.close()
    return results

def should_update_cache(filter_key=None, filter_value=None, cache_duration_hours=24):
    """Check if we should update the cache for this filter combination"""
    conn = get_db_connection()
    
    if filter_key and filter_value:
        cursor = conn.execute(
            "SELECT last_updated FROM cache_status WHERE filter_key = ? AND filter_value = ?", 
            (filter_key, json.dumps(filter_value))
        )
        result = cursor.fetchone()
        
        if result:
            last_updated = datetime.fromisoformat(result['last_updated'])
            cache_expired = datetime.now() - last_updated > timedelta(hours=cache_duration_hours)
            conn.close()
            return cache_expired
    
    # Check if we have any jobs in the database as a fallback
    cursor = conn.execute("SELECT COUNT(*) as count FROM jobs")
    result = cursor.fetchone()
    conn.close()
    
    # If we have no jobs at all, we should update
    return result['count'] == 0 