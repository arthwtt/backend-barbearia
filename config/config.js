function parseBoolean(value, defaultValue = false) {
  if (value == null || value === '') return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function buildDialectOptions() {
  const dialectOptions = {
    dateStrings: true,
    typeCast: true
  };

  if (parseBoolean(process.env.DB_SSL, false)) {
    dialectOptions.ssl = {
      require: true,
      rejectUnauthorized: parseBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED, false)
    };
  }

  return dialectOptions;
}

function createConfig(defaultDatabase) {
  const baseConfig = {
    dialect: 'mysql',
    timezone: process.env.DB_TIMEZONE || '-03:00',
    dialectOptions: buildDialectOptions()
  };

  if (process.env.DATABASE_URL) {
    return {
      ...baseConfig,
      use_env_variable: 'DATABASE_URL'
    };
  }

  return {
    ...baseConfig,
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || defaultDatabase,
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306)
  };
}

module.exports = {
  development: createConfig('barbearia_db'),
  test: createConfig('database_test'),
  production: createConfig('database_production')
};
