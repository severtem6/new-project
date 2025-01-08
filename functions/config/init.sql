-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    email VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255),
    password VARCHAR(255),
    role VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для логов
CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(255),
    user_email VARCHAR(255),
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для аналитики
CREATE TABLE IF NOT EXISTS analytics (
    id SERIAL PRIMARY KEY,
    survey_id VARCHAR(255),
    action_type VARCHAR(50),
    user_email VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 