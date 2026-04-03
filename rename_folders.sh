#!/bin/bash

# ============================================================
# rename_folders.sh
# Renames folders: spaces & special chars → underscore, lowercase
# Safe: uses `mv`, no content touched
# Usage: bash rename_folders.sh [target_directory]
#        Default: current directory (.)
# ============================================================

TARGET_DIR="${1:-.}"

echo "��� Scanning: $TARGET_DIR"
echo "-------------------------------------------"

# Count renamed
count=0

for dir in "$TARGET_DIR"/*/; do
    [ -d "$dir" ] || continue  # skip if not a directory

    # Strip trailing slash and get just the folder name
    old_name=$(basename "$dir")

    # Transform: lowercase + replace spaces and special chars with _
    new_name=$(echo "$old_name" \
        | tr '[:upper:]' '[:lower:]' \
        | sed 's/[^a-z0-9._-]/_/g' \
        | sed 's/__*/_/g' \
        | sed 's/^_//; s/_$//')

    if [ "$old_name" != "$new_name" ]; then
        old_path="$TARGET_DIR/$old_name"
        new_path="$TARGET_DIR/$new_name"

        # Safety check: don't overwrite existing folder
        if [ -d "$new_path" ]; then
            echo "⚠️  SKIP (target exists): '$old_name' → '$new_name'"
            continue
        fi

        mv -- "$old_path" "$new_path"
        echo "✅ Renamed: '$old_name' → '$new_name'"
        ((count++))
    else
        echo "⏭️  No change: '$old_name'"
    fi
done

echo "-------------------------------------------"
echo "✅ Done. $count folder(s) renamed."
