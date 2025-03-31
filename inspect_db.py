import sqlite3
from django.conf import settings

# Path to your SQLite database
DB_PATH = settings.DATABASES['default']['NAME']

# Connect to the database
connection = sqlite3.connect(DB_PATH)
cursor = connection.cursor()

# List all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("Tables:", tables)

# Close the connection
connection.close()