"""
YachaqAI — Setup completo de Supabase (DB + Storage buckets).

Ejecutar desde backend/:
    python -m scripts.setup_supabase

Requiere en .env:
    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (buckets)
    SUPABASE_DB_URL                          (tablas)

Para obtener SUPABASE_DB_URL:
    Supabase Dashboard > Settings > Database > Connection string > URI
"""
from __future__ import annotations

import sys
from pathlib import Path

import psycopg2

from supabase import create_client

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.config import settings

SQL_FILE = Path(__file__).parent / "setup_database.sql"

BUCKETS = [
    {
        "id": "wikis",
        "public": False,
        "file_size_limit": 10 * 1024 * 1024,
        "allowed_mime_types": [
            "text/markdown",
            "text/plain",
            "application/json",
            "application/octet-stream",
            "text/markdown; charset=utf-8",
        ],
    },
    {
        "id": "pdfs",
        "public": False,
        "file_size_limit": 50 * 1024 * 1024,
        "allowed_mime_types": ["application/pdf"],
    },
]


def setup_buckets() -> None:
    print("\n--- Storage Buckets ---\n")
    sb = create_client(settings.supabase_url, settings.supabase_service_role_key)

    existing: list[str] = []
    try:
        existing = [b.id for b in sb.storage.list_buckets()]
    except Exception:
        pass

    for bucket in BUCKETS:
        bid = bucket["id"]
        if bid in existing:
            print(f"  [OK]      {bid} (ya existe)")
            continue
        try:
            sb.storage.create_bucket(
                bid,
                options={
                    "public": bucket["public"],
                    "file_size_limit": bucket["file_size_limit"],
                    "allowed_mime_types": bucket["allowed_mime_types"],
                },
            )
            print(f"  [CREADO]  {bid}")
        except Exception as e:
            msg = str(e)
            if "already exists" in msg.lower():
                print(f"  [OK]      {bid} (ya existe)")
            else:
                print(f"  [ERROR]   {bid}: {msg[:120]}")


def setup_database() -> None:
    print("\n--- Base de Datos ---\n")

    if not settings.supabase_db_url:
        print("  [SKIP] SUPABASE_DB_URL no configurada en .env")
        print("         Obtener en: Supabase Dashboard > Settings > Database > Connection string > URI")
        print(f"         O pegar el SQL manualmente desde: {SQL_FILE.name}")
        return

    if not SQL_FILE.exists():
        print(f"  [ERROR] No se encontro {SQL_FILE}")
        return

    sql = SQL_FILE.read_text(encoding="utf-8")

    # Separar statements respetando bloques $$ de PL/pgSQL
    statements = _split_sql(sql)
    print(f"  {len(statements)} statements a ejecutar\n")

    conn = psycopg2.connect(settings.supabase_db_url)
    conn.autocommit = True
    cur = conn.cursor()

    ok = 0
    skip = 0
    errors = 0

    for stmt in statements:
        label = _stmt_label(stmt)
        try:
            cur.execute(stmt)
            print(f"  [OK]      {label}")
            ok += 1
        except psycopg2.errors.DuplicateObject:
            conn.rollback()
            print(f"  [SKIP]    {label} (ya existe)")
            skip += 1
        except psycopg2.errors.DuplicateTable:
            conn.rollback()
            print(f"  [SKIP]    {label} (ya existe)")
            skip += 1
        except Exception as e:
            conn.rollback()
            msg = str(e).strip().split("\n")[0]
            if "already exists" in msg.lower():
                print(f"  [SKIP]    {label} (ya existe)")
                skip += 1
            else:
                print(f"  [ERROR]   {label}")
                print(f"            {msg[:150]}")
                errors += 1

    cur.close()
    conn.close()

    print(f"\n  Resultado: {ok} OK, {skip} omitidos, {errors} errores")


def _split_sql(sql: str) -> list[str]:
    """Separa SQL en statements individuales, respetando bloques $$ de PL/pgSQL."""
    statements: list[str] = []
    current: list[str] = []
    in_dollar = False

    for line in sql.split("\n"):
        stripped = line.strip()
        if not stripped or stripped.startswith("--"):
            continue

        if "$$" in stripped:
            count = stripped.count("$$")
            if count % 2 == 1:
                in_dollar = not in_dollar
            current.append(line)
            if not in_dollar and stripped.endswith(";"):
                statements.append("\n".join(current))
                current = []
            continue

        if in_dollar:
            current.append(line)
            continue

        current.append(line)
        if stripped.endswith(";"):
            statements.append("\n".join(current))
            current = []

    if current:
        joined = "\n".join(current).strip()
        if joined:
            statements.append(joined)

    return [s.strip() for s in statements if s.strip()]


def _stmt_label(stmt: str) -> str:
    """Extrae una etiqueta legible del statement SQL."""
    first = stmt.strip().split("\n")[0][:80]
    for kw in ("CREATE TABLE", "CREATE INDEX", "CREATE POLICY", "DROP POLICY",
               "DROP TRIGGER", "CREATE TRIGGER", "CREATE OR REPLACE FUNCTION",
               "ALTER TABLE"):
        if kw in first.upper():
            return first
    return first[:60]


def main() -> None:
    print("=" * 55)
    print("  YachaqAI — Setup Supabase")
    print("=" * 55)

    if not settings.supabase_url or not settings.supabase_service_role_key:
        print("\n[ERROR] Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env")
        sys.exit(1)

    setup_buckets()
    setup_database()

    print("\n" + "=" * 55)
    print("  Setup completado")
    print("=" * 55)


if __name__ == "__main__":
    main()
