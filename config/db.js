import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // from Neon
  ssl: { rejectUnauthorized: false },
});

// Auto-create tables if not exist
const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users_copy (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      is_verified BOOLEAN DEFAULT FALSE
    );
  `);

  await pool.query(`
 CREATE TABLE IF NOT EXISTS categories_copy (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    user_id INT REFERENCES users_copy(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

  `);

  await pool.query(`
  CREATE TABLE IF NOT EXISTS tasks_copy (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users_copy(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Pending',
    priority VARCHAR(50) DEFAULT 'Medium',
    category_id INT REFERENCES categories_copy(id) ON DELETE SET NULL,
    due_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
    `);
  console.log("✅ Users table ready");
};

initDB();

export default pool;
