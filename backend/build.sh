#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Run database migrations and setup
# Run database migrations and setup
python scripts/init_db.py
