CREATE TABLE users (
    id SERIAL NOT NULL PRIMARY KEY,
    name VARCHAR(50)NOT NULL,
    email VARCHAR(100)NOT NULL UNIQUE,
    password VARCHAR(40)NOT NULL
)