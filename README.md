# README

## Summary
Brief instructions to run app with Node.js and to initialize a local MySQL database using XAMPP

## Prerequisites
- Node.js (v14+ recommended)
- npm (comes with Node.js)
- XAMPP (includes Apache + MySQL / MariaDB)
- The SQL dump file (`sql_dump.sql`) included in this repository

## Setup (project)
1. Open a terminal in the project root (where `index.js` lives):
  ```
  cd node_template
  ```
2. Install dependencies:
  ```
  npm install
  ```

## Configure database connection
COnfigure environmental variables in `.env` file. If not then rename `env_sample.txt` to `.env`. Backup contents if needed
```
DB_HOST=
DB_PORT=
DB_USER=
DB_PASS=
DB_NAME=
```
Adjust keys to match your project's configuration names.

## Initialize XAMPP and MySQL
1. Start XAMPP Control Panel.
2. Start **Apache** and **MySQL** services.
3. Open phpMyAdmin: http://localhost/phpmyadmin
4. Paste SQL dump into sql tab of phpMyAdmin

## Run the application
Start the Node.js process:
```
node index.js
```

## For PowerShell

Allows to run Scripts

`Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force`
