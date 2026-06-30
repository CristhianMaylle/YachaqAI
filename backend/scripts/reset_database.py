"""
YachaqAI — Limpia toda la base de datos y Storage para empezar de cero.

ADVERTENCIA: Esto borra TODOS los datos (tablas Postgres + buckets Storage).
No borra el esquema (tablas, RLS, triggers) — solo las filas y archivos.

Uso:
    python -m scripts.reset_database
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.dependencies import get_supabase

TABLES = [
    "lint_reports",
    "wiki_chat_messages",
    "notifications",
    "srs_responses",
    "srs_states",
    "study_sessions",
    "schedule_slots",
    "ingest_jobs",
    "decks",
    "profiles",
]

BUCKETS = ["wikis", "pdfs"]


def clear_tables() -> None:
    sb = get_supabase()
    print("--- Limpiando tablas Postgres ---\n")
    for table in TABLES:
        try:
            result = sb.table(table).select("*", count="exact").execute()
            count = result.count or 0
            if count == 0:
                print(f"  [OK]    {table}: ya vacia")
                continue

            if table == "decks":
                sb.table(table).delete().neq("id", "__never__").execute()
            else:
                sb.table(table).delete().gte(
                    "created_at" if table != "srs_states" else "updated_at",
                    "1900-01-01",
                ).execute()

            print(f"  [OK]    {table}: {count} filas borradas")
        except Exception as e:
            print(f"  [ERROR] {table}: {str(e)[:150]}")


def _list_all_paths(sb, bucket: str, prefix: str = "") -> list[str]:
    """Lista recursivamente todos los archivos (no carpetas) en un bucket."""
    paths: list[str] = []
    try:
        items = sb.storage.from_(bucket).list(prefix)
    except Exception:
        return paths

    for item in items:
        name = item.get("name", "")
        full = f"{prefix}/{name}" if prefix else name
        if item.get("id") is None:
            paths.extend(_list_all_paths(sb, bucket, full))
        else:
            paths.append(full)
    return paths


def clear_storage() -> None:
    sb = get_supabase()
    print("\n--- Limpiando Storage ---\n")
    for bucket in BUCKETS:
        paths = _list_all_paths(sb, bucket)
        if not paths:
            print(f"  [OK]    {bucket}: ya vacio")
            continue
        try:
            # Supabase storage remove acepta lotes; partir en chunks de 100
            for i in range(0, len(paths), 100):
                chunk = paths[i:i + 100]
                sb.storage.from_(bucket).remove(chunk)
            print(f"  [OK]    {bucket}: {len(paths)} archivos borrados")
        except Exception as e:
            print(f"  [ERROR] {bucket}: {str(e)[:150]}")


def main() -> None:
    print("=" * 55)
    print("  YachaqAI — Reset completo de datos")
    print("=" * 55)
    print()

    clear_tables()
    clear_storage()

    print("\n" + "=" * 55)
    print("  Reset completado. Esquema intacto, datos en cero.")
    print("=" * 55)


if __name__ == "__main__":
    main()
