package repositories

import (
	"testing"

	"github.com/livekit/meet/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
)

func TestVerifyPassword(t *testing.T) {
	repo := &UserRepository{}

	// Test correct password
	password := "testpassword123"
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	user := &models.User{
		PasswordHash: string(hashedPassword),
	}

	err = repo.VerifyPassword(user, password)
	if err != nil {
		t.Errorf("Expected password verification to succeed, got error: %v", err)
	}

	// Test incorrect password
	err = repo.VerifyPassword(user, "wrongpassword")
	if err == nil {
		t.Error("Expected password verification to fail for incorrect password")
	}
}

func TestPasswordHashing(t *testing.T) {
	password := "testpassword123"

	// Generate hash
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	// Verify hash
	err = bcrypt.CompareHashAndPassword(hashedPassword, []byte(password))
	if err != nil {
		t.Errorf("Password hash verification failed: %v", err)
	}

	// Verify different password fails
	err = bcrypt.CompareHashAndPassword(hashedPassword, []byte("wrongpassword"))
	if err == nil {
		t.Error("Expected hash verification to fail for different password")
	}
}
