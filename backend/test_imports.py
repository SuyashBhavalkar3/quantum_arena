"""
Diagnostic script to verify model imports work correctly
Run this before starting the server to check for issues
"""

print("Testing model imports...")

try:
    print("1. Importing Base...")
    from authentication.database import Base
    print(f"   ✓ Base imported: {Base}")
    
    print("\n2. Importing authentication models...")
    from authentication import models as auth_models
    print(f"   ✓ Auth models imported")
    
    print("\n3. Importing candidate_profile models...")
    from candidate_profile import models as candidate_models
    print(f"   ✓ Candidate profile models imported")
    print(f"   - Experience: {candidate_models.Experience}")
    print(f"   - Education: {candidate_models.Education}")
    print(f"   - Skill: {candidate_models.Skill}")
    print(f"   - Project: {candidate_models.Project}")
    
    print("\n4. Importing resume_parsing models...")
    from resume_parsing import models as resume_models
    print(f"   ✓ Resume parsing models imported")
    print(f"   - Candidate: {resume_models.Candidate}")
    
    print("\n5. Checking for duplicate tables...")
    tables = Base.metadata.tables
    print(f"   Total tables registered: {len(tables)}")
    for table_name in sorted(tables.keys()):
        print(f"   - {table_name}")
    
    print("\n✅ All imports successful! No duplicate table definitions detected.")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
