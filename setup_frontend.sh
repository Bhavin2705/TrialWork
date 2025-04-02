#!/bin/bash

SOURCE_DIR="frontend"
DEST_DIR="backend/views"

# Ensure the destination directory exists
mkdir -p "$DEST_DIR"

# Move all .ejs files from frontend to backend/views
mv "$SOURCE_DIR"/*.ejs "$DEST_DIR"

echo "All .ejs files moved to $DEST_DIR successfully."
