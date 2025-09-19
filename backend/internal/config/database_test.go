package config

import (
	"os"
	"testing"
	"time"
)

func TestLoadDatabaseConfig(t *testing.T) {
	// Set test environment variables
	os.Setenv("DB_HOST", "testhost")
	os.Setenv("DB_PORT", "3307")
	os.Setenv("DB_NAME", "testdb")
	os.Setenv("DB_USER", "testuser")
	os.Setenv("DB_PASSWORD", "testpass")
	os.Setenv("DB_MAX_OPEN_CONNS", "10")
	os.Setenv("DB_MAX_IDLE_CONNS", "5")
	os.Setenv("DB_CONN_MAX_LIFETIME", "1m")

	defer func() {
		// Clean up environment variables
		os.Unsetenv("DB_HOST")
		os.Unsetenv("DB_PORT")
		os.Unsetenv("DB_NAME")
		os.Unsetenv("DB_USER")
		os.Unsetenv("DB_PASSWORD")
		os.Unsetenv("DB_MAX_OPEN_CONNS")
		os.Unsetenv("DB_MAX_IDLE_CONNS")
		os.Unsetenv("DB_CONN_MAX_LIFETIME")
	}()

	config := LoadDatabaseConfig()

	// Test all configuration values
	if config.Host != "testhost" {
		t.Errorf("Expected Host to be 'testhost', got '%s'", config.Host)
	}
	if config.Port != "3307" {
		t.Errorf("Expected Port to be '3307', got '%s'", config.Port)
	}
	if config.Name != "testdb" {
		t.Errorf("Expected Name to be 'testdb', got '%s'", config.Name)
	}
	if config.User != "testuser" {
		t.Errorf("Expected User to be 'testuser', got '%s'", config.User)
	}
	if config.Password != "testpass" {
		t.Errorf("Expected Password to be 'testpass', got '%s'", config.Password)
	}
	if config.MaxOpenConns != 10 {
		t.Errorf("Expected MaxOpenConns to be 10, got %d", config.MaxOpenConns)
	}
	if config.MaxIdleConns != 5 {
		t.Errorf("Expected MaxIdleConns to be 5, got %d", config.MaxIdleConns)
	}
	if config.ConnMaxLifetime != time.Minute {
		t.Errorf("Expected ConnMaxLifetime to be 1m, got %v", config.ConnMaxLifetime)
	}
}

func TestLoadDatabaseConfigDefaults(t *testing.T) {
	// Clear environment variables to test defaults
	os.Unsetenv("DB_HOST")
	os.Unsetenv("DB_PORT")
	os.Unsetenv("DB_NAME")
	os.Unsetenv("DB_USER")
	os.Unsetenv("DB_PASSWORD")
	os.Unsetenv("DB_MAX_OPEN_CONNS")
	os.Unsetenv("DB_MAX_IDLE_CONNS")
	os.Unsetenv("DB_CONN_MAX_LIFETIME")

	config := LoadDatabaseConfig()

	// Test default values
	if config.Host != "localhost" {
		t.Errorf("Expected default Host to be 'localhost', got '%s'", config.Host)
	}
	if config.Port != "3306" {
		t.Errorf("Expected default Port to be '3306', got '%s'", config.Port)
	}
	if config.Name != "gaming_voice_chat" {
		t.Errorf("Expected default Name to be 'gaming_voice_chat', got '%s'", config.Name)
	}
	if config.User != "root" {
		t.Errorf("Expected default User to be 'root', got '%s'", config.User)
	}
	if config.Password != "" {
		t.Errorf("Expected default Password to be empty, got '%s'", config.Password)
	}
	if config.MaxOpenConns != 25 {
		t.Errorf("Expected default MaxOpenConns to be 25, got %d", config.MaxOpenConns)
	}
	if config.MaxIdleConns != 25 {
		t.Errorf("Expected default MaxIdleConns to be 25, got %d", config.MaxIdleConns)
	}
	if config.ConnMaxLifetime != 5*time.Minute {
		t.Errorf("Expected default ConnMaxLifetime to be 5m, got %v", config.ConnMaxLifetime)
	}
}

func TestGetDSN(t *testing.T) {
	config := &DatabaseConfig{
		Host:     "localhost",
		Port:     "3306",
		Name:     "testdb",
		User:     "testuser",
		Password: "testpass",
	}

	expected := "testuser:testpass@tcp(localhost:3306)/testdb?charset=utf8mb4&parseTime=True&loc=Local"
	dsn := config.GetDSN()

	if dsn != expected {
		t.Errorf("Expected DSN to be '%s', got '%s'", expected, dsn)
	}
}
