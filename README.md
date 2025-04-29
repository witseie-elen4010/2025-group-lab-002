# App Name: Suspect 404

## Contributers:
- Aaliyah Noorbhai
- Rizwaanah Seedat 
- Glen McKenzie
- Noah Disler

## Setting Up PostgreSQL and Restoring the Database

1. **Install PostgreSQL**  
   Download and install PostgreSQL from [https://www.postgresql.org/download/](https://www.postgresql.org/download/).
   OR 
   'brew install postgresql@17' for unix based systems

2. **Start the PostgreSQL server**  
   Make sure your PostgreSQL server is running. You can typically start it via your system's service manager or using terminal commands like:
   ```
   sudo service postgresql start
   ```
   (Command may vary depending on your operating system and installation method.)
   Brew:
   ```
   brew services start postgresql@17
   ```

3. **Create a new database**  
   Open a terminal and run:
   ```
   createdb suspect404
   ```

4. **Restore the database from SQL files**  
   Navigate to the directory containing your `.sql` file and run:
   ```
   psql -d suspect404 -f database-backup.sql
   ```

5. **Verify the restoration**  
   Connect to the database to ensure the data has been restored:
   ```
   psql suspect404
   ```

**Note:**  
- Ensure your PostgreSQL user has sufficient privileges.
- You may need to specify a username with `-U your_username` and host with `-h your_host` if different from defaults.
