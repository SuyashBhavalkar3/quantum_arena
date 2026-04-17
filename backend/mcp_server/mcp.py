import openai
import sqlite3
import json
import os
from datetime import datetime
from typing import List, Dict, Any
from dotenv import load_dotenv
load_dotenv()  # Load environment variables from .env file

class HireflowCRUDClient:
    def __init__(self, api_key: str):
        # self.client = openai.OpenAI(api_key=api_key)
        self.client = openai.OpenAI(api_key=api_key)
        print("Initialized HireflowCRUDClient with OpenAI API key")
        self.db_path = os.path.join("/backend/hireflow.db")
        
    def get_database_schema(self) -> str:
        """Get complete database schema with relationships"""
        conn = sqlite3.connect(self.db_path)
        
        # Get all tables
        tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
        
        schema_info = "HIREFLOW DATABASE SCHEMA (SQLite):\n\n"
        
        for table in tables:
            table_name = table[0]
            schema_info += f"Table: {table_name}\n"
            
            # Get column info with details
            columns = conn.execute(f"PRAGMA table_info({table_name})").fetchall()
            for col in columns:
                pk = " (PRIMARY KEY)" if col[5] else ""
                nullable = " NOT NULL" if col[3] else ""
                default = f" DEFAULT {col[4]}" if col[4] else ""
                schema_info += f"  - {col[1]} {col[2]}{pk}{nullable}{default}\n"
            
            # Get sample data count
            count = conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
            schema_info += f"  Records: {count}\n"
            
            # Show sample data if exists
            if count > 0:
                sample = conn.execute(f"SELECT * FROM {table_name} LIMIT 2").fetchall()
                if sample:
                    schema_info += f"  Sample data: {sample[0]}\n"
            
            schema_info += "\n"
        
        conn.close()
        return schema_info
    
    def execute_query(self, query: str, params: tuple = ()) -> Dict[str, Any]:
        """Execute any SQL query with proper error handling"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Execute query
            cursor.execute(query, params)
            
            # Determine query type
            query_type = query.strip().upper().split()[0]
            
            if query_type in ['SELECT', 'PRAGMA']:
                # Fetch results for SELECT queries
                results = cursor.fetchall()
                data = [dict(row) for row in results]
                conn.close()
                return {
                    "success": True,
                    "query_type": query_type,
                    "data": data,
                    "row_count": len(data)
                }
            else:
                # For INSERT, UPDATE, DELETE
                conn.commit()
                affected_rows = cursor.rowcount
                last_id = cursor.lastrowid if query_type == 'INSERT' else None
                conn.close()
                return {
                    "success": True,
                    "query_type": query_type,
                    "affected_rows": affected_rows,
                    "last_insert_id": last_id,
                    "message": f"{query_type} operation completed successfully"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "query": query
            }
    
    def ai_generate_query(self, user_request: str, operation_type: str = "auto") -> str:
        """Generate SQL query using OpenAI based on user request"""
        schema = self.get_database_schema()
        
        operation_guidance = {
            "create": "Generate INSERT statements to add new records",
            "read": "Generate SELECT statements to retrieve data", 
            "update": "Generate UPDATE statements to modify existing records",
            "delete": "Generate DELETE statements to remove records",
            "auto": "Determine the appropriate operation (CREATE/READ/UPDATE/DELETE) based on the request"
        }
        
        prompt = f"""You are a SQLite database expert working with the hireflow recruitment system.

{schema}

IMPORTANT SQLite Guidelines:
- Use SQLite syntax only
- For listing tables: SELECT name FROM sqlite_master WHERE type='table'
- For table structure: PRAGMA table_info(table_name)
- Use proper SQLite data types and functions
- For dates, use datetime('now') or specific date strings
- Use AUTOINCREMENT for auto-incrementing primary keys

User Request: {user_request}
Operation Type: {operation_guidance[operation_type]}

Generate ONLY the SQL query (no explanation). Make sure it's valid SQLite syntax.
If the request involves multiple operations, provide the most appropriate single query.
"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1
            )
            
            return response.choices[0].message.content.strip()
        except Exception as e:
            return f"Error generating query: {str(e)}"
    
    def ai_analyze_results(self, user_request: str, query: str, results: Dict[str, Any]) -> str:
        """Analyze query results using OpenAI"""
        analysis_prompt = f"""
User Request: {user_request}
SQL Query: {query}
Results: {json.dumps(results, indent=2, default=str)}

Provide a clear, comprehensive analysis of these results including:
1. What the query accomplished
2. Key insights from the data
3. Summary statistics if applicable
4. Any recommendations or observations
5. Next steps if relevant

Be specific and actionable in your analysis.
"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": analysis_prompt}],
                temperature=0.7
            )
            
            return response.choices[0].message.content
        except Exception as e:
            return f"Error analyzing results: {str(e)}"
    
    def database_overview(self) -> str:
        """Get comprehensive database overview"""
        overview_queries = [
            ("Total Users", "SELECT COUNT(*) as count FROM users"),
            ("Employers vs Candidates", "SELECT is_employer, COUNT(*) as count FROM users GROUP BY is_employer"),
            ("Total Jobs", "SELECT COUNT(*) as count FROM jobs"),
            ("Total Applications", "SELECT COUNT(*) as count FROM applications"),
            ("Application Status Distribution", "SELECT status, COUNT(*) as count FROM applications GROUP BY status"),
            ("Total Candidates", "SELECT COUNT(*) as count FROM candidates"),
            ("Candidates with Completed Profiles", "SELECT profile_completed, COUNT(*) as count FROM candidates GROUP BY profile_completed"),
            ("Assessment Questions by Type", "SELECT question_type, COUNT(*) as count FROM assessment_questions GROUP BY question_type"),
            ("Interview Questions by Type", "SELECT question_type, COUNT(*) as count FROM interview_questions GROUP BY question_type"),
        ]
        
        overview_results = {}
        for name, query in overview_queries:
            result = self.execute_query(query)
            if result["success"]:
                overview_results[name] = result["data"]
        
        # Generate AI analysis of overview
        analysis_prompt = f"""
Analyze this comprehensive overview of the hireflow recruitment database:

{json.dumps(overview_results, indent=2, default=str)}

Provide insights about:
1. Overall system health and usage
2. User engagement patterns
3. Recruitment pipeline efficiency
4. Data quality observations
5. Recommendations for improvement
6. Key metrics and trends

Be specific and actionable.
"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": analysis_prompt}],
                temperature=0.7
            )
            
            analysis = response.choices[0].message.content
            
            return f"""
HIREFLOW DATABASE OVERVIEW
{'='*50}

Raw Statistics:
{json.dumps(overview_results, indent=2, default=str)}

AI Analysis:
{analysis}
"""
        except Exception as e:
            return f"Overview generated, but analysis failed: {str(e)}\n\nRaw data:\n{json.dumps(overview_results, indent=2, default=str)}"
    
    def interactive_session(self):
        """Interactive session for database operations"""
        print("🚀 HIREFLOW DATABASE CRUD CLIENT")
        print("="*50)
        print("Available operations:")
        print("• CREATE: Add new records (users, jobs, applications, etc.)")
        print("• READ: Query and retrieve data")
        print("• UPDATE: Modify existing records")
        print("• DELETE: Remove records")
        print("• ANALYZE: Get database overview and insights")
        print("• SCHEMA: View database structure")
        print("• Type 'quit' to exit")
        print("="*50)
        
        while True:
            print("\n" + "-"*30)
            user_input = input("Your request: ").strip()
            
            if user_input.lower() == 'quit':
                print("👋 Goodbye!")
                break
            elif user_input.lower() == 'analyze':
                print("\n📊 Generating database overview...")
                overview = self.database_overview()
                print(overview)
                continue
            elif user_input.lower() == 'schema':
                print("\n📋 Database Schema:")
                print(self.get_database_schema())
                continue
            
            print(f"\n🤖 Processing: {user_input}")
            print("🔍 Generating SQL query...")
            
            # Generate query
            sql_query = self.ai_generate_query(user_input)
            print(f"📝 Generated Query: {sql_query}")
            
            # Confirm execution
            confirm = input("\n❓ Execute this query? (y/n/edit): ").lower()
            
            if confirm == 'n':
                continue
            elif confirm == 'edit':
                sql_query = input("Enter your SQL query: ")
            
            # Execute query
            print("⚡ Executing query...")
            results = self.execute_query(sql_query)
            
            if results["success"]:
                print("✅ Query executed successfully!")
                
                if results.get("data"):
                    print(f"\n📊 Results ({results['row_count']} rows):")
                    print(json.dumps(results["data"], indent=2, default=str))
                else:
                    print(f"\n✅ {results['message']}")
                    if results.get("affected_rows"):
                        print(f"   Affected rows: {results['affected_rows']}")
                    if results.get("last_insert_id"):
                        print(f"   New record ID: {results['last_insert_id']}")
                
                # Generate AI analysis
                print("\n🧠 AI Analysis:")
                analysis = self.ai_analyze_results(user_input, sql_query, results)
                print(analysis)
                
            else:
                print(f"❌ Query failed: {results['error']}")
                print("💡 Try rephrasing your request or check the query syntax.")

def main():
    print("HIREFLOW DATABASE CRUD CLIENT")
    print("="*40)
    
  
    api_key = os.getenv("OPENAI_API_KEY")
    print(api_key) # From .env
    if not api_key:
        api_key = input("Enter your OpenAI API key: ").strip()
        return
   
    
    # Initialize client
    try:
        client = HireflowCRUDClient(api_key)
        print("✅ Connected to hireflow database!")
        
        # Start interactive session
        client.interactive_session()
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    main()