package config

import (
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"
	"path/filepath"
	"strings"

	"gorm.io/gorm"
)

// DatabaseMigrator handles database initialization and migrations
type DatabaseMigrator struct {
	db *sql.DB
}

// NewDatabaseMigrator creates a new database migrator
func NewDatabaseMigrator(db *sql.DB) *DatabaseMigrator {
	return &DatabaseMigrator{db: db}
}

// InitializeDatabase creates the database if it doesn't exist and runs migrations
func (m *DatabaseMigrator) InitializeDatabase() error {
	log.Println("Initializing database...")

	// Check if we can connect to the database
	if err := m.db.Ping(); err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	// Run migrations
	if err := m.runMigrations(); err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	log.Println("Database initialization completed successfully")
	return nil
}

// runMigrations executes the SQL schema file
func (m *DatabaseMigrator) runMigrations() error {
	log.Println("Running database migrations...")

	// Read the schema file
	schemaPath := filepath.Join("scripts", "schema.sql")
	schemaSQL, err := ioutil.ReadFile(schemaPath)
	if err != nil {
		return fmt.Errorf("failed to read schema file: %w", err)
	}

	// Split SQL statements by semicolon and execute each one
	statements := m.splitSQLStatements(string(schemaSQL))

	for i, stmt := range statements {
		stmt = strings.TrimSpace(stmt)
		if stmt == "" || strings.HasPrefix(stmt, "--") {
			continue // Skip empty lines and comments
		}

		log.Printf("Executing statement %d: %s", i+1, stmt[:min(100, len(stmt))]+"...")
		if _, err := m.db.Exec(stmt); err != nil {
			return fmt.Errorf("failed to execute statement %d: %w\nStatement: %s", i+1, err, stmt)
		}
	}

	log.Println("Database migrations completed successfully")
	return nil
}

// splitSQLStatements splits SQL content into individual statements
func (m *DatabaseMigrator) splitSQLStatements(sql string) []string {
	// Split by semicolon and filter out comments and empty statements
	statements := strings.Split(sql, ";")
	var result []string

	for _, stmt := range statements {
		// Clean up the statement
		lines := strings.Split(stmt, "\n")
		var cleanLines []string

		for _, line := range lines {
			line = strings.TrimSpace(line)
			// Remove inline comments (everything after --)
			if commentIndex := strings.Index(line, "--"); commentIndex >= 0 {
				line = strings.TrimSpace(line[:commentIndex])
			}
			// Skip empty lines
			if line != "" {
				cleanLines = append(cleanLines, line)
			}
		}

		if len(cleanLines) > 0 {
			cleanStmt := strings.Join(cleanLines, " ")
			cleanStmt = strings.TrimSpace(cleanStmt)
			if cleanStmt != "" {
				result = append(result, cleanStmt)
			}
		}
	}

	return result
}

// min returns the minimum of two integers
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// ValidateSchema checks if all required tables exist
func (m *DatabaseMigrator) ValidateSchema() error {
	requiredTables := []string{"users", "rooms", "channels", "room_members", "user_channels"}

	for _, table := range requiredTables {
		var exists int
		query := "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?"
		if err := m.db.QueryRow(query, table).Scan(&exists); err != nil {
			return fmt.Errorf("failed to check table %s: %w", table, err)
		}

		if exists == 0 {
			return fmt.Errorf("required table %s does not exist", table)
		}
	}

	log.Println("Database schema validation passed")
	return nil
}

// GetDatabaseStatus returns information about the database connection and schema
func (m *DatabaseMigrator) GetDatabaseStatus() (map[string]interface{}, error) {
	status := make(map[string]interface{})

	// Check connection
	if err := m.db.Ping(); err != nil {
		status["connected"] = false
		status["error"] = err.Error()
		return status, err
	}
	status["connected"] = true

	// Check schema validity
	if err := m.ValidateSchema(); err != nil {
		status["schema_valid"] = false
		status["schema_error"] = err.Error()
	} else {
		status["schema_valid"] = true
	}

	// Get table counts
	tables := []string{"users", "rooms", "channels", "room_members", "user_channels"}
	tableCounts := make(map[string]int)

	for _, table := range tables {
		var count int
		query := fmt.Sprintf("SELECT COUNT(*) FROM %s", table)
		if err := m.db.QueryRow(query).Scan(&count); err != nil {
			tableCounts[table] = -1 // Indicate error
		} else {
			tableCounts[table] = count
		}
	}
	status["table_counts"] = tableCounts

	return status, nil
}

// GORMMigrator handles GORM database initialization and migrations
type GORMMigrator struct {
	db *gorm.DB
}

// NewGORMMigrator creates a new GORM database migrator
func NewGORMMigrator(db *gorm.DB) *GORMMigrator {
	return &GORMMigrator{db: db}
}

// AutoMigrate runs GORM auto-migration for all models
func (m *GORMMigrator) AutoMigrate(models ...interface{}) error {
	log.Println("Running GORM AutoMigrate...")

	if err := m.db.AutoMigrate(models...); err != nil {
		return fmt.Errorf("failed to auto-migrate: %w", err)
	}

	log.Println("GORM AutoMigrate completed successfully")
	return nil
}

// ValidateGORMConnection checks if GORM connection is working
func (m *GORMMigrator) ValidateGORMConnection() error {
	sqlDB, err := m.db.DB()
	if err != nil {
		return fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	if err := sqlDB.Ping(); err != nil {
		return fmt.Errorf("failed to ping GORM database: %w", err)
	}

	log.Println("GORM database connection validated successfully")
	return nil
}
