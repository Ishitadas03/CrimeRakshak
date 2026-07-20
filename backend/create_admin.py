import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.services.auth_service import register_user, get_user_by_username
from app.models.rbac import Role

def main():
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
    
    db = SessionLocal()
    try:
        admin_role = db.query(Role).filter_by(role_name="admin").first()
        if not admin_role:
            admin_role = Role(role_name="admin", permissions={"all": True})
            db.add(admin_role)
            db.commit()
            print("Created 'admin' role.")
            
        viewer_role = db.query(Role).filter_by(role_name="viewer").first()
        if not viewer_role:
            viewer_role = Role(role_name="viewer", permissions={"read": True})
            db.add(viewer_role)
            db.commit()
            print("Created 'viewer' role.")
            
        user = get_user_by_username(db, "admin")
        if not user:
            user = register_user(
                db,
                username="admin",
                email="admin@example.com",
                password="ChangeMe123!",
                role_names=["admin"]
            )
            print("Successfully created 'admin' user with password 'ChangeMe123!'.")
        else:
            print("Admin user already exists.")
    except Exception as e:
        print(f"Failed to create admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
