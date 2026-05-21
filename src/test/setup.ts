// Global test setup — mock environment variables so API routes don't need real DB/keys
process.env.DATABASE_URL = "postgresql://test:test@localhost/test";
process.env.ANTHROPIC_API_KEY = "";
process.env.NEXT_PUBLIC_APP_NAME = "Inyo";
