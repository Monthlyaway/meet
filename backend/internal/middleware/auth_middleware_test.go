package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestAuthMiddleware_NoHeader(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a test auth service (nil is fine for this test since we won't reach token validation)
	middleware := AuthMiddleware(nil)

	// Create test context
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/test", nil)

	// Call middleware
	middleware(c)

	// Check that request was aborted with 401
	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401, got %d", w.Code)
	}

	if !c.IsAborted() {
		t.Error("Expected request to be aborted")
	}
}

func TestAuthMiddleware_InvalidHeaderFormat(t *testing.T) {
	gin.SetMode(gin.TestMode)

	middleware := AuthMiddleware(nil)

	// Create test context with invalid auth header
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/test", nil)
	c.Request.Header.Set("Authorization", "InvalidFormat token")

	// Call middleware
	middleware(c)

	// Check that request was aborted with 401
	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401, got %d", w.Code)
	}

	if !c.IsAborted() {
		t.Error("Expected request to be aborted")
	}
}

func TestAuthMiddleware_EmptyToken(t *testing.T) {
	gin.SetMode(gin.TestMode)

	middleware := AuthMiddleware(nil)

	// Create test context with empty token
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/test", nil)
	c.Request.Header.Set("Authorization", "Bearer ")

	// Call middleware
	middleware(c)

	// Check that request was aborted with 401
	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401, got %d", w.Code)
	}

	if !c.IsAborted() {
		t.Error("Expected request to be aborted")
	}
}

func TestOptionalAuthMiddleware_NoHeader(t *testing.T) {
	gin.SetMode(gin.TestMode)

	middleware := OptionalAuthMiddleware(nil)

	// Create test context
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/test", nil)

	// Call middleware - should not panic and not abort
	middleware(c)

	// Check that request was not aborted
	if c.IsAborted() {
		t.Error("Expected request to not be aborted")
	}
}

func TestGetUserIDFromContext(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create test context
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	// Test with no user ID in context
	_, exists := GetUserIDFromContext(c)
	if exists {
		t.Error("Expected user ID to not exist in context")
	}

	// Test with user ID in context
	userID := uint(123)
	c.Set("user_id", userID)

	extractedID, exists := GetUserIDFromContext(c)
	if !exists {
		t.Error("Expected user ID to exist in context")
	}

	if extractedID != userID {
		t.Errorf("Expected user ID %d, got %d", userID, extractedID)
	}
}
