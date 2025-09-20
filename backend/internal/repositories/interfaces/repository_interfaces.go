package interfaces

import "github.com/livekit/meet/backend/internal/models"

// RoomRepositoryInterface defines the interface for room repository operations
type RoomRepositoryInterface interface {
	CreateRoom(room *models.Room) error
	CreateChannel(channel *models.Channel) error
	GetRoomByID(id uint) (*models.Room, error)
	GetMainLobbyChannel(roomID uint) (*models.Channel, error)
	ConnectUserToMainLobby(userID uint, roomID uint) (*models.UserChannel, error)
	FindByAccessToken(accessToken string) (*models.Room, error)
	CreateOrUpdateMembership(userID, roomID uint) (*models.RoomMember, error)
	GetRoomChannels(roomID uint) ([]models.Channel, error)
	GetUserRooms(userID uint) ([]models.Room, error)
	DeleteRoom(roomID uint) error
	IsRoomOwner(roomID, userID uint) (bool, error)
	GetRoomByAccessToken(token string) (*models.Room, error)
	GetChannelByID(channelID uint) (*models.Channel, error)
	SwitchUserChannel(userID uint, newChannelID uint) (*models.UserChannel, error)
	GetChannelMembers(channelID uint) ([]models.UserChannel, error)
	GetUserCurrentChannel(userID uint) (*models.UserChannel, error)
}

// UserRepositoryInterface defines the interface for user repository operations
type UserRepositoryInterface interface {
	GetByID(id uint) (*models.User, error)
}