-- Bot connection settings — WhatsApp Business API & Instagram API credentials
-- These columns store the vendor's API keys for bot automation

ALTER TABLE users ADD COLUMN whatsapp_phone_id VARCHAR(100) DEFAULT NULL;
ALTER TABLE users ADD COLUMN whatsapp_access_token VARCHAR(500) DEFAULT NULL;
ALTER TABLE users ADD COLUMN whatsapp_business_id VARCHAR(100) DEFAULT NULL;
ALTER TABLE users ADD COLUMN whatsapp_connected TINYINT DEFAULT 0;
ALTER TABLE users ADD COLUMN instagram_access_token VARCHAR(500) DEFAULT NULL;
ALTER TABLE users ADD COLUMN instagram_page_id VARCHAR(100) DEFAULT NULL;
ALTER TABLE users ADD COLUMN instagram_connected TINYINT DEFAULT 0;
