package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/livekit/meet/backend/internal/models"
	"github.com/livekit/meet/backend/internal/services"
)

// AuthMiddleware creates a middleware that validates JWT tokens
func AuthMiddleware(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header required",
			})
			c.Abort()
			return
		}

		// Check for Bearer token format
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid authorization header format. Expected 'Bearer <token>'",
			})
			c.Abort()
			return
		}

		// Extract token
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Token not provided",
			})
			c.Abort()
			return
		}

		// Validate token and get user
		user, err := authService.GetUserFromToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid or expired token",
			})
			c.Abort()
			return
		}

		// Store user in context for use in handlers
		c.Set("user", user)
		c.Set("user_id", user.ID)

		// Continue to next handler
		c.Next()
	}
}

// OptionalAuthMiddleware creates a middleware that optionally validates JWT tokens
// If token is present and valid, user is set in context
// If token is missing or invalid, request continues without user context
func OptionalAuthMiddleware(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			// No auth header, continue without authentication
			c.Next()
			return
		}

		// Check for Bearer token format
		if !strings.HasPrefix(authHeader, "Bearer ") {
			// Invalid format, continue without authentication
			c.Next()
			return
		}

		// Extract token
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == "" {
			// Empty token, continue without authentication
			c.Next()
			return
		}

		// Try to validate token and get user
		user, err := authService.GetUserFromToken(tokenString)
		if err == nil {
			// Valid token, store user in context
			c.Set("user", user)
			c.Set("user_id", user.ID)
		}
		// If token is invalid, continue without user context

		// Continue to next handler
		c.Next()
	}
}

// GetUserFromContext extracts the authenticated user from the Gin context
func GetUserFromContext(c *gin.Context) (*models.User, bool) {
	user, exists := c.Get("user")
	if !exists {
		return nil, false
	}

	userModel, ok := user.(*models.User)
	if !ok {
		return nil, false
	}

	return userModel, true
}

// GetUserIDFromContext extracts the authenticated user ID from the Gin context
func GetUserIDFromContext(c *gin.Context) (uint, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return 0, false
	}

	id, ok := userID.(uint)
	if !ok {
		return 0, false
	}

	return id, true
}
