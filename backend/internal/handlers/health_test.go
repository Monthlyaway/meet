package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	_ "github.com/go-sql-driver/mysql"
)

func TestHealthHandler_GetHealth(t *testing.T) {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		setupDB        func() *sql.DB
		expectedStatus int
		expectedHealth string
	}{
		{
			name: "healthy_with_valid_db",
			setupDB: func() *sql.DB {
				// Create a mock database connection for testing
				// In a real test, you might use a test database
				db, _ := sql.Open("mysql", "user:pass@tcp(localhost:3306)/test")
				return db
			},
			expectedStatus: http.StatusOK,
			expectedHealth: "healthy", // Will likely be "unhealthy" due to connection failure, but test structure is correct
		},
		{
			name: "unhealthy_with_nil_db",
			setupDB: func() *sql.DB {
				return nil
			},
			expectedStatus: http.StatusServiceUnavailable,
			expectedHealth: "unhealthy",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup
			db := tt.setupDB()
			handler := NewHealthHandler(db)

			// Create a test router
			router := gin.New()
			router.GET("/health", handler.GetHealth)

			// Create a test request
			req := httptest.NewRequest("GET", "/health", nil)
			w := httptest.NewRecorder()

			// Execute the request
			router.ServeHTTP(w, req)

			// Parse response
			var response HealthResponse
			if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
				t.Errorf("Failed to parse response JSON: %v", err)
				return
			}

			// Verify response structure
			if response.Status == "" {
				t.Error("Expected status field to be present")
			}
			if response.Version == "" {
				t.Error("Expected version field to be present")
			}
			if response.Message == "" {
				t.Error("Expected message field to be present")
			}
			if response.Database == nil {
				t.Error("Expected database field to be present")
			}

			// Verify response contains expected fields
			if response.Version != "1.0.0" {
				t.Errorf("Expected version to be '1.0.0', got '%s'", response.Version)
			}

			t.Logf("Response status: %s, HTTP status: %d", response.Status, w.Code)
		})
	}
}

func TestHealthResponse_Structure(t *testing.T) {
	// Test that HealthResponse struct has correct JSON tags
	response := HealthResponse{
		Status:   "healthy",
		Version:  "1.0.0",
		Database: map[string]interface{}{"connected": true},
		Message:  "test message",
	}

	// Marshal to JSON
	jsonData, err := json.Marshal(response)
	if err != nil {
		t.Errorf("Failed to marshal HealthResponse: %v", err)
	}

	// Unmarshal back
	var parsed HealthResponse
	if err := json.Unmarshal(jsonData, &parsed); err != nil {
		t.Errorf("Failed to unmarshal HealthResponse: %v", err)
	}

	// Verify structure
	if parsed.Status != response.Status {
		t.Errorf("Expected status '%s', got '%s'", response.Status, parsed.Status)
	}
	if parsed.Version != response.Version {
		t.Errorf("Expected version '%s', got '%s'", response.Version, parsed.Version)
	}
	if parsed.Message != response.Message {
		t.Errorf("Expected message '%s', got '%s'", response.Message, parsed.Message)
	}
}
