package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/livekit/meet/backend/internal/config"
)

// HealthHandler handles health check requests
type HealthHandler struct {
	db *sql.DB
}

// NewHealthHandler creates a new health handler
func NewHealthHandler(db *sql.DB) *HealthHandler {
	return &HealthHandler{db: db}
}

// HealthResponse represents the health check response
type HealthResponse struct {
	Status   string                 `json:"status"`
	Version  string                 `json:"version"`
	Database map[string]interface{} `json:"database"`
	Message  string                 `json:"message"`
}

// GetHealth handles GET /health requests
func (h *HealthHandler) GetHealth(c *gin.Context) {
	// Initialize default response
	status := "unhealthy"
	message := "Database connection not available"
	var dbStatus map[string]interface{}

	// Check if database connection exists
	if h.db == nil {
		dbStatus = map[string]interface{}{
			"connected":    false,
			"schema_valid": false,
			"error":        "Database connection is nil",
		}
	} else {
		// Check database status
		migrator := config.NewDatabaseMigrator(h.db)
		var dbErr error
		dbStatus, dbErr = migrator.GetDatabaseStatus()

		// Determine overall health status
		if dbErr != nil {
			status = "unhealthy"
			message = "Database connection issue detected"
		} else if connected, ok := dbStatus["connected"].(bool); !ok || !connected {
			status = "unhealthy"
			message = "Database is not connected"
		} else if schemaValid, ok := dbStatus["schema_valid"].(bool); !ok || !schemaValid {
			status = "degraded"
			message = "Database schema validation failed"
		} else {
			status = "healthy"
			message = "Gaming Voice Chat Backend is running"
		}
	}

	// Prepare response
	response := HealthResponse{
		Status:   status,
		Version:  "1.0.0",
		Database: dbStatus,
		Message:  message,
	}

	// Set appropriate HTTP status code
	var httpStatus int
	switch status {
	case "healthy":
		httpStatus = http.StatusOK
	case "degraded":
		httpStatus = http.StatusOK // Still operational but with issues
	case "unhealthy":
		httpStatus = http.StatusServiceUnavailable
	default:
		httpStatus = http.StatusInternalServerError
	}

	c.JSON(httpStatus, response)
}
