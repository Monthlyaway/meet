package interfaces

import "github.com/livekit/meet/backend/internal/models"

// RoomServiceInterface defines the interface for room service operations
type RoomServiceInterface interface {
	CreateRoom(roomData *models.RoomCreation, creatorID uint) (*models.Room, error)
	GetUserRooms(userID uint) ([]models.Room, error)
	GetRoomWithDetails(roomID uint) (*models.Room, error)
	DeleteRoom(roomID, userID uint) error
	ValidateRoomAccess(roomID, userID uint) (bool, error)
	JoinRoom(userID uint, accessToken string) (*models.RoomJoinResponse, error)
}