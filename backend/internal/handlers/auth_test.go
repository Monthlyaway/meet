package handlers

import (
	"testing"

	"github.com/livekit/meet/backend/internal/models"
)

func TestValidateRegistration(t *testing.T) {
	handler := &AuthHandler{}

	registration := &models.UserRegistration{
		Username: "testuser",
		Email:    "test@example.com",
		Password: "password123",
	}

	err := handler.validateRegistration(registration)
	if err != nil {
		t.Errorf("Expected validation to pass, got error: %v", err)
	}
}

func TestUserResponseConversion(t *testing.T) {
	user := &models.User{
		ID:       1,
		Username: "testuser",
		Email:    "test@example.com",
	}

	response := user.ToResponse()
	if response.ID != user.ID {
		t.Errorf("Expected ID %d, got %d", user.ID, response.ID)
	}
	if response.Username != user.Username {
		t.Errorf("Expected Username %s, got %s", user.Username, response.Username)
	}
	if response.Email != user.Email {
		t.Errorf("Expected Email %s, got %s", user.Email, response.Email)
	}
}
