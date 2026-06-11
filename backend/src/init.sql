CREATE TABLE IF NOT EXISTS "Music".song_data (
    id SERIAL PRIMARY KEY,
    song VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    album VARCHAR(255) NOT NULL,
    genre VARCHAR(255) NOT NULL,
    release_year INT NOT NULL,
    duration INT NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(5) NOT NULL,
    tags VARCHAR(255),
    thumbnail_path VARCHAR(255),
    sample_rate INT,
    bit_rate INT,
    channels INT
);