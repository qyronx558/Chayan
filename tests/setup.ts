// Runs before every test file. Only fake values are used here; tests never
// talk to a real database, email, SMS or payment provider.
process.env.AUTH_SECRET ??= "test-auth-secret-0123456789abcdef0123456789"
process.env.NEXT_PUBLIC_APP_URL ??= "https://example.com"
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test"
process.env.TZ ??= "UTC"
