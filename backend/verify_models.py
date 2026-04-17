"""
Quick verification that all models import correctly
"""
print("=" * 60)
print("VERIFYING MODEL IMPORTS")
print("=" * 60)

try:
    print("\n1. Importing Base...")
    from authentication.database import Base
    print("   ✅ Success")
    
    print("\n2. Importing all models...")
    from authentication import models as auth_models
    from resume_parsing import models as resume_models
    from candidate_profile import models as candidate_models
    print("   ✅ Success")
    
    print("\n3. Checking candidate_profile models...")
    print(f"   - Experience: {candidate_models.Experience}")
    print(f"   - Education: {candidate_models.Education}")
    print(f"   - Skill: {candidate_models.Skill}")
    print(f"   - Project: {candidate_models.Project}")
    print(f"   - Certification: {candidate_models.Certification}")
    
    print("\n4. Checking resume_parsing models...")
    print(f"   - Candidate: {resume_models.Candidate}")
    
    print("\n5. Checking registered tables...")
    tables = list(Base.metadata.tables.keys())
    print(f"   Total tables: {len(tables)}")
    for table in sorted(tables):
        print(f"   - {table}")
    
    print("\n" + "=" * 60)
    print("✅ ALL CHECKS PASSED - Server should start successfully!")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
