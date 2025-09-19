package services

import (
	"os"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/livekit/meet/backend/internal/models"
)

func TestGenerateAndValidateToken(t *testing.T) {
	// Set test JWT secret
	os.Setenv("JWT_SECRET", "test-secret-key")

	authService := NewAuthService(nil) // userRepo not needed for this test

	// Test user
	user := &models.User{
		ID:       1,
		Username: "testuser",
		Email:    "test@example.com",
	}

	// Generate token
	token, err := authService.GenerateToken(user)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}

	if token == "" {
		t.Error("Generated token is empty")
	}

	// Validate token
	claims, err := authService.ValidateToken(token)
	if err != nil {
		t.Fatalf("Failed to validate token: %v", err)
	}

	// Check claims
	if claims.UserID != user.ID {
		t.Errorf("Expected UserID %d, got %d", user.ID, claims.UserID)
	}
	if claims.Username != user.Username {
		t.Errorf("Expected Username %s, got %s", user.Username, claims.Username)
	}
	if claims.Email != user.Email {
		t.Errorf("Expected Email %s, got %s", user.Email, claims.Email)
	}
	if claims.Issuer != "livekit-meet-backend" {
		t.Errorf("Expected Issuer 'livekit-meet-backend', got %s", claims.Issuer)
	}

	// Check expiration
	if claims.ExpiresAt.Before(time.Now()) {
		t.Error("Token should not be expired")
	}

	// Clean up
	os.Unsetenv("JWT_SECRET")
}

func TestValidateInvalidToken(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret-key")
	defer os.Unsetenv("JWT_SECRET")

	authService := NewAuthService(nil)

	// Test with invalid token
	_, err := authService.ValidateToken("invalid-token")
	if err == nil {
		t.Error("Expected error for invalid token")
	}

	// Test with empty token
	_, err = authService.ValidateToken("")
	if err == nil {
		t.Error("Expected error for empty token")
	}
}

func TestValidateExpiredToken(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret-key")
	authService := NewAuthService(nil)

	// Create an expired token manually
	claims := &JWTClaims{
		UserID:   1,
		Username: "testuser",
		Email:    "test@example.com",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Hour)), // Expired 1 hour ago
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
			Issuer:    "livekit-meet-backend",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(authService.jwtSecret)
	if err != nil {
		t.Fatalf("Failed to create expired token: %v", err)
	}

	// Try to validate expired token
	_, err = authService.ValidateToken(tokenString)
	if err == nil {
		t.Error("Expected error for expired token")
	}

	// Clean up
	os.Unsetenv("JWT_SECRET")
}

func TestJWTSecretFromEnvironment(t *testing.T) {
	// Test with custom JWT secret
	testSecret := "custom-test-secret"
	os.Setenv("JWT_SECRET", testSecret)

	authService := NewAuthService(nil)
	if string(authService.jwtSecret) != testSecret {
		t.Errorf("Expected JWT secret '%s', got '%s'", testSecret, string(authService.jwtSecret))
	}

	// Clean up
	os.Unsetenv("JWT_SECRET")
}

func TestJWTSecretRequiredPanic(t *testing.T) {
	// Ensure JWT_SECRET is not set
	os.Unsetenv("JWT_SECRET")

	// Test that NewAuthService panics when JWT_SECRET is not set
	defer func() {
		if r := recover(); r == nil {
			t.Error("Expected panic when JWT_SECRET is not set")
		}
	}()

	NewAuthService(nil)
}
