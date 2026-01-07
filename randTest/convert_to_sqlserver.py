"""
SQL Server Conversion Script
Converts MySQL syntax in our.sql to valid SQL Server T-SQL
"""

import re
import sys

def convert_sql_file(input_file, output_file):
    """Convert MySQL syntax to SQL Server syntax"""
    
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Store ENUM definitions for later CHECK constraint generation
    enum_definitions = {}
    
    # 1. Find and convert ENUM types to VARCHAR with CHECK constraints
    enum_pattern = r'(\w+)\s+ENUM\(([^)]+)\)'
    
    def replace_enum(match):
        column_name = match.group(1)
        enum_values = match.group(2)
        # Store for CHECK constraint
        enum_key = f"{column_name}_{len(enum_definitions)}"
        enum_definitions[enum_key] = (column_name, enum_values)
        return f'{column_name} VARCHAR(50)'
    
    content = re.sub(enum_pattern, replace_enum, content)
    
    # 2. Convert BOOLEAN to BIT
    content = re.sub(r'\bBOOLEAN\b', 'BIT', content)
    
    # 3. Convert TIMESTAMP to DATETIME2
    content = re.sub(r'\bTIMESTAMP\b', 'DATETIME2', content)
    
    # 4. Convert DEFAULT CURRENT_TIMESTAMP to DEFAULT GETDATE()
    content = re.sub(r'DEFAULT CURRENT_TIMESTAMP', 'DEFAULT GETDATE()', content)
    
    # 5. Convert DEFAULT TRUE/FALSE to DEFAULT 1/0
    content = re.sub(r'DEFAULT TRUE', 'DEFAULT 1', content)
    content = re.sub(r'DEFAULT FALSE', 'DEFAULT 0', content)
    
    # 6. Convert JSON to NVARCHAR(MAX)
    content = re.sub(r'\bJSON\b', 'NVARCHAR(MAX)', content)
    
    # 7. Convert TEXT to VARCHAR(MAX)
    content = re.sub(r'\bTEXT\b', 'VARCHAR(MAX)', content)
    
    # 8. Fix unquoted string defaults
    content = re.sub(r'DEFAULT USA\b', "DEFAULT 'USA'", content)
    content = re.sub(r'DEFAULT USD\b', "DEFAULT 'USD'", content)
    content = re.sub(r'DEFAULT warning\b', "DEFAULT 'warning'", content)
    content = re.sub(r'DEFAULT open\b', "DEFAULT 'open'", content)
    content = re.sub(r'DEFAULT ai\b', "DEFAULT 'ai'", content)
    content = re.sub(r'DEFAULT pending\b', "DEFAULT 'pending'", content)
    content = re.sub(r'DEFAULT uploaded\b', "DEFAULT 'uploaded'", content)
    content = re.sub(r'DEFAULT full\b', "DEFAULT 'full'", content)
    content = re.sub(r'DEFAULT active\b', "DEFAULT 'active'", content)
    content = re.sub(r'DEFAULT view_only\b', "DEFAULT 'view_only'", content)
    content = re.sub(r'DEFAULT business_owner\b', "DEFAULT 'business_owner'", content)
    content = re.sub(r'DEFAULT confirmed\b', "DEFAULT 'confirmed'", content)
    content = re.sub(r'DEFAULT medium\b', "DEFAULT 'medium'", content)
    
    # 9. Fix VARCHAR without size in address table (specific fix)
    content = re.sub(r'street\s+VARCHAR\s*,', 'street VARCHAR(255),', content)
    content = re.sub(r'city\s+varchar\s*,', 'city VARCHAR(100),', content)
    content = re.sub(r'country\s+varchar\s*,', 'country VARCHAR(100),', content)
    content = re.sub(r'state\s+varchar\s*,', 'state VARCHAR(100),', content)
    
    # 10. Fix column name with space: "companies id" -> "companies_id"
    content = re.sub(r'companies id', 'companies_id', content)
    
    # Write converted content
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    # Generate CHECK constraints script
    check_constraints = []
    
    # We need to manually add CHECK constraints based on the ENUM patterns we found
    # This requires parsing the table contexts, which is complex
    # For now, we'll generate a separate script
    
    print(f"✅ Conversion complete!")
    print(f"   Input:  {input_file}")
    print(f"   Output: {output_file}")
    print(f"\n📊 Changes made:")
    print(f"   - Converted ENUM to VARCHAR(50)")
    print(f"   - Converted BOOLEAN to BIT")
    print(f"   - Converted TIMESTAMP to DATETIME2")
    print(f"   - Converted DEFAULT CURRENT_TIMESTAMP to DEFAULT GETDATE()")
    print(f"   - Converted DEFAULT TRUE/FALSE to DEFAULT 1/0")
    print(f"   - Converted JSON to NVARCHAR(MAX)")
    print(f"   - Converted TEXT to VARCHAR(MAX)")
    print(f"   - Fixed unquoted string defaults")
    print(f"   - Fixed VARCHAR without sizes")
    print(f"   - Fixed 'companies id' -> 'companies_id'")
    print(f"\n⚠️  Note: You may want to add CHECK constraints manually for data integrity")
    print(f"   Example: ALTER TABLE users ADD CONSTRAINT CK_users_role CHECK (role IN ('accountant','business_owner','admin'))")

if __name__ == "__main__":
    input_file = "our.sql"
    output_file = "our_sqlserver.sql"
    
    try:
        convert_sql_file(input_file, output_file)
    except FileNotFoundError:
        print(f"❌ Error: {input_file} not found")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
