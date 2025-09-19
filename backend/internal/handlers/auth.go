package handlers

import (
	"fmt"
	"net/http"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/livekit/meet/backend/internal/models"
	"github.com/livekit/meet/backend/internal/services"
)

// AuthHandler handles authentication-related HTTP requests
type AuthHandler struct {
	authService *services.AuthService
}

// NewAuthHandler creates a new authentication handler
func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
	}
}

// Register handles user registration
// POST /api/auth/register
func (h *AuthHandler) Register(c *gin.Context) {
	var registration models.UserRegistration

	// Bind JSON request to registration struct
	if err := c.ShouldBindJSON(&registration); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Validate input
	if err := h.validateRegistration(&registration); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Validation failed",
			"details": err.Error(),
		})
		return
	}

	// Register user
	authResponse, err := h.authService.Register(&registration)
	if err != nil {
		if strings.Contains(err.Error(), "email already registered") ||
			strings.Contains(err.Error(), "username already taken") {
			c.JSON(http.StatusConflict, gin.H{
				"error":   "Registration failed",
				"details": err.Error(),
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Registration failed",
			"details": "Internal server error",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User registered successfully",
		"user":    authResponse.User,
		"token":   authResponse.Token,
	})
}

// Login handles user login
// POST /api/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var login models.UserLogin

	// Bind JSON request to login struct
	if err := c.ShouldBindJSON(&login); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Authenticate user
	authResponse, err := h.authService.Login(&login)
	if err != nil {
		if strings.Contains(err.Error(), "invalid credentials") {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Authentication failed",
				"details": "Invalid email or password",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Login failed",
			"details": "Internal server error",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"user":    authResponse.User,
		"token":   authResponse.Token,
	})
}

// Logout handles user logout
// POST /api/auth/logout
func (h *AuthHandler) Logout(c *gin.Context) {
	// For JWT tokens, logout is typically handled client-side by removing the token
	// However, we can implement token blacklisting in the future if needed
	c.JSON(http.StatusOK, gin.H{
		"message": "Logout successful",
	})
}

// GetProfile returns the current user's profile
// GET /api/auth/profile
func (h *AuthHandler) GetProfile(c *gin.Context) {
	// Get user from context (set by auth middleware)
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
		})
		return
	}

	userModel, ok := user.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Internal server error",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": userModel.ToResponse(),
	})
}

// validateRegistration performs additional validation on registration data
func (h *AuthHandler) validateRegistration(registration *models.UserRegistration) error {
	// Sanitize and validate username
	if strings.TrimSpace(registration.Username) != registration.Username {
		return fmt.Errorf("username cannot contain leading or trailing whitespace")
	}

	// Validate username contains only alphanumeric characters and underscores
	usernameRegex := regexp.MustCompile(`^[a-zA-Z0-9_]+$`)
	if !usernameRegex.MatchString(registration.Username) {
		return fmt.Errorf("username can only contain letters, numbers, and underscores")
	}

	// Validate password strength
	if len(registration.Password) < 8 {
		return fmt.Errorf("password must be at least 8 characters long")
	}

	// Check for at least one uppercase, lowercase, and number
	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(registration.Password)
	hasLower := regexp.MustCompile(`[a-z]`).MatchString(registration.Password)
	hasNumber := regexp.MustCompile(`[0-9]`).MatchString(registration.Password)

	if !hasUpper || !hasLower || !hasNumber {
		return fmt.Errorf("password must contain at least one uppercase letter, one lowercase letter, and one number")
	}

	return nil
}
