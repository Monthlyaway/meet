package interfaces

import (
	"github.com/livekit/meet/backend/internal/models"
	"github.com/livekit/meet/backend/internal/services"
)

// AuthServiceInterface defines the contract for authentication services
type AuthServiceInterface interface {
	Register(registration *models.UserRegistration) (*services.AuthResponse, error)
	Login(login *models.UserLogin) (*services.AuthResponse, error)
	ValidateToken(tokenString string) (*services.JWTClaims, error)
	GetUserFromToken(tokenString string) (*models.User, error)
	GenerateToken(user *models.User) (string, error)
}
