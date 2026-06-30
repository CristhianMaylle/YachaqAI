"""
YachaqAI — Ejecuta un archivo .sql individual contra la base de datos.

Uso:
    python -m scripts.run_migration <nombre_archivo.sql>

Ejemplo:
    python -m scripts.run_migration migrate_deck_id_to_text.sql
"""
from __future__ import annotations

import sys
from pathlib import Path

import psycopg2

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.config import settings
from scripts.setup_supabase import _split_sql, _stmt_label


def main() -> None:
    if len(sys.argv) < 2:
        print("Uso: python -m scripts.run_migration <archivo.sql>")
        sys.exit(1)

    sql_file = Path(__file__).parent / sys.argv[1]
    if not sql_file.exists():
        print(f"[ERROR] No se encontro {sql_file}")
        sys.exit(1)

    if not settings.supabase_db_url:
        print("[ERROR] Configura SUPABASE_DB_URL en .env")
        sys.exit(1)

    sql = sql_file.read_text(encoding="utf-8")
    statements = _split_sql(sql)

    print(f"Ejecutando {sql_file.name} ({len(statements)} statements)\n")

    conn = psycopg2.connect(settings.supabase_db_url)
    conn.autocommit = True
    cur = conn.cursor()

    ok = skip = errors = 0
    for stmt in statements:
        label = _stmt_label(stmt)
        try:
            cur.execute(stmt)
            print(f"  [OK]    {label}")
            ok += 1
        except Exception as e:
            conn.rollback()
            msg = str(e).strip().split("\n")[0]
            if "does not exist" in msg.lower() and "drop" in stmt.lower():
                print(f"  [SKIP]  {label} (ya no existe)")
                skip += 1
            else:
                print(f"  [ERROR] {label}\n          {msg[:200]}")
                errors += 1

    cur.close()
    conn.close()
    print(f"\nResultado: {ok} OK, {skip} omitidos, {errors} errores")


if __name__ == "__main__":
    main()
