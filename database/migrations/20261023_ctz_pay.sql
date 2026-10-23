-- Configure the receiving account in Admin > Payment accounts before enabling.
INSERT INTO payment_accounts (provider, label, enabled)
VALUES ('ctz', 'CTZ Pay', false)
ON CONFLICT (provider) DO NOTHING;
