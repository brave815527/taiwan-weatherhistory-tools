ALTER TABLE weather_data DROP CONSTRAINT IF EXISTS weather_data_station_id_date_key;
ALTER TABLE weather_data ALTER COLUMN date TYPE TIMESTAMP WITH TIME ZONE USING date::timestamp with time zone;
ALTER TABLE weather_data ADD CONSTRAINT weather_data_station_id_date_key UNIQUE(station_id, date);