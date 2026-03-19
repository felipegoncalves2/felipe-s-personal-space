import os
import glob

base_file = "c:/Users/felipe.goncalves/Documents/Projeto MPS/Monitoramento/felipe-s-personal-space/deploy_schema_gerado.sql"
final_file = "c:/Users/felipe.goncalves/Documents/Projeto MPS/Monitoramento/felipe-s-personal-space/supabase_deploy_completo.sql"
migrations_dir = "c:/Users/felipe.goncalves/Documents/Projeto MPS/Monitoramento/felipe-s-personal-space/supabase/migrations"

with open(base_file, "r", encoding="utf-8") as f:
    schema = f.read()

# Constraints & Foreign Keys derived from types.ts
fks = """
--
-- Primary Keys & Constraints for tables that didn't have 'id'
--
ALTER TABLE public.permissions ADD PRIMARY KEY (key);

--
-- Foreign Keys
--
ALTER TABLE public.monitoring_alerts ADD CONSTRAINT monitoring_alerts_tratado_por_fkey FOREIGN KEY (tratado_por) REFERENCES public.users(id);
ALTER TABLE public.role_audit_log ADD CONSTRAINT role_audit_log_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id);
ALTER TABLE public.role_audit_log ADD CONSTRAINT role_audit_log_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_permission_key_fkey FOREIGN KEY (permission_key) REFERENCES public.permissions(key);
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);
ALTER TABLE public.sessions ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
"""

# Append existing migrations
migration_contents = []
migration_files = sorted(glob.glob(os.path.join(migrations_dir, "*.sql")))

for m_file in migration_files:
    with open(m_file, "r", encoding="utf-8") as f:
        content = f.read()
        
        # Remove CREATE TABLE presentation_settings from migrations to avoid conflict 
        # (It's already in the basic schema)
        import re
        content = re.sub(r"CREATE TABLE public\.presentation_settings.*?;\n", "", content, flags=re.DOTALL)
        
        migration_contents.append(f"-- ==========================================\n-- Migration: {os.path.basename(m_file)}\n-- ==========================================\n\n{content}")

migrations_combined = "\n\n".join(migration_contents)

final_script = "-- ========================================================\n"
final_script += "-- SUPABASE FULL DEPLOYMENT SCRIPT (AUTO-GENERATED)\n"
final_script += "-- ========================================================\n\n"
final_script += "-- 1. TABLES GENERATED FROM TYPES.TS\n\n"
final_script += schema
final_script += "\n\n"
final_script += "-- 2. CONSTRAINTS AND FOREIGN KEYS\n"
final_script += fks
final_script += "\n\n"
final_script += "-- 3. RPCs, RLS, AND TRIGGERS FROM MANUAL MIGRATIONS\n"
final_script += migrations_combined

with open(final_file, "w", encoding="utf-8") as f:
    f.write(final_script)

print(f"Deployment script successfully generated at {final_file}")
