/**
 * Umzug Storage class using Postgres as a backend
 */
class UmzugPgStorage {
  /**
   * Primary class constructor. Use this to provide a client for the class to use
   * @param {Object} options
   */
  constructor({client}) {
    this.client = client;
    this.configured = false;

    this.logMigration = this.logMigration.bind(this);
    this.unlogMigration = this.unlogMigration.bind(this);
    this.executed = this.executed.bind(this);
    this.configure = this.configure.bind(this);
  }

  /**
   * Log a migration to the database
   * @param {String} migrationName Name of migration to log
   */
  async logMigration(migrationName) {
    if (!this.configured) {
      await this.configure();
    }
    await this.client.query('INSERT INTO migrations (migration_name) VALUES ($1)', [migrationName]);
    return;
  }

  /**
   * Unlog a migration from the database
   * @param {String} migrationName Name of migration to unlog
   */
  async unlogMigration(migrationName) {
    if (!this.configured) {
      await this.configure();
    }
    await this.client.query('DELETE FROM migrations WHERE migration_name=$1', [migrationName]);
    return;
  }

  /**
   * Get all executed migrations from the database
   */
  async executed() {
    if (!this.configured) {
      await this.configure();
    }
    const {rows: migrations} = await this.client.query('SELECT migration_name FROM migrations');
    return migrations.map((x) => x.migration_name);
  }

  /**
   * Internal method used to ensure database is set up for us to use
   */
  async configure() {
    await this.client.query('CREATE TABLE IF NOT EXISTS migrations (' +
      'migration_name VARCHAR NOT NULL, ' +
      'run_date TIMESTAMP DEFAULT NOW(), ' +
      'PRIMARY KEY (migration_name)' +
      ')',
    );
    this.configured = true;
  }
}

module.exports = UmzugPgStorage;
