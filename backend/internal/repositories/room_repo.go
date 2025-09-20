package repositories

import (
	"errors"
	"fmt"
	"time"

	"github.com/livekit/meet/backend/internal/models"
	"gorm.io/gorm"
)

// RoomRepository handles database operations for rooms
type RoomRepository struct {
	db *gorm.DB
}

// NewRoomRepository creates a new room repository
func NewRoomRepository(db *gorm.DB) *RoomRepository {
	return &RoomRepository{db: db}
}

// CreateRoom creates a new room in the database
func (r *RoomRepository) CreateRoom(room *models.Room) error {
	if err := r.db.Create(room).Error; err != nil {
		return fmt.Errorf("failed to create room: %v", err)
	}
	return nil
}

// GetRoomByID retrieves a room by its ID
func (r *RoomRepository) GetRoomByID(id uint) (*models.Room, error) {
	room := &models.Room{}
	err := r.db.Where("id = ? AND is_active = ?", id, true).First(room).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("room not found")
		}
		return nil, fmt.Errorf("failed to get room: %v", err)
	}

	return room, nil
}

// GetRoomByAccessToken retrieves a room by its access token
func (r *RoomRepository) GetRoomByAccessToken(token string) (*models.Room, error) {
	room := &models.Room{}
	err := r.db.Where("access_token = ? AND is_active = ?", token, true).First(room).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("room not found")
		}
		return nil, fmt.Errorf("failed to get room: %v", err)
	}

	return room, nil
}

// GetUserRooms retrieves all rooms for a specific user (created and joined)
func (r *RoomRepository) GetUserRooms(userID uint) ([]models.Room, error) {
	var rooms []models.Room

	// Get rooms created by user
	err := r.db.Where("creator_id = ? AND is_active = ?", userID, true).
		Order("created_at DESC").
		Find(&rooms).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get user rooms: %v", err)
	}

	// For now, just return created rooms
	// TODO: Add room_members join when many-to-many relationship is needed
	return rooms, nil
}

// DeleteRoom soft deletes a room (sets is_active to false)
func (r *RoomRepository) DeleteRoom(roomID uint) error {
	err := r.db.Model(&models.Room{}).Where("id = ?", roomID).Update("is_active", false).Error
	if err != nil {
		return fmt.Errorf("failed to delete room: %v", err)
	}
	return nil
}

// CreateChannel creates a new channel in a room
func (r *RoomRepository) CreateChannel(channel *models.Channel) error {
	if err := r.db.Create(channel).Error; err != nil {
		return fmt.Errorf("failed to create channel: %v", err)
	}
	return nil
}

// GetRoomChannels retrieves all channels for a room
func (r *RoomRepository) GetRoomChannels(roomID uint) ([]models.Channel, error) {
	var channels []models.Channel
	err := r.db.Where("room_id = ?", roomID).
		Order("is_main_lobby DESC, created_at ASC").
		Find(&channels).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get room channels: %v", err)
	}
	return channels, nil
}

// IsRoomOwner checks if a user is the owner of a room
func (r *RoomRepository) IsRoomOwner(roomID, userID uint) (bool, error) {
	var count int64
	err := r.db.Model(&models.Room{}).
		Where("id = ? AND creator_id = ? AND is_active = ?", roomID, userID, true).
		Count(&count).Error
	if err != nil {
		return false, fmt.Errorf("failed to check room ownership: %v", err)
	}
	return count > 0, nil
}

// FindByAccessToken retrieves a room by its access token with channels preloaded
func (r *RoomRepository) FindByAccessToken(accessToken string) (*models.Room, error) {
	room := &models.Room{}
	err := r.db.Preload("Channels").Where("access_token = ? AND is_active = ?", accessToken, true).First(room).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("room not found")
		}
		return nil, fmt.Errorf("failed to get room: %v", err)
	}

	return room, nil
}

// CreateOrUpdateMembership creates a new room membership or reactivates an existing one
func (r *RoomRepository) CreateOrUpdateMembership(userID, roomID uint) (*models.RoomMember, error) {
	// Check if membership already exists
	var existingMembership models.RoomMember
	err := r.db.Where("user_id = ? AND room_id = ?", userID, roomID).First(&existingMembership).Error

	if err == nil {
		// Membership exists, update it to active
		existingMembership.IsActive = true
		existingMembership.JoinedAt = time.Now()
		if err := r.db.Save(&existingMembership).Error; err != nil {
			return nil, fmt.Errorf("failed to update membership: %v", err)
		}
		return &existingMembership, nil
	}

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("failed to check existing membership: %v", err)
	}

	// Create new membership
	newMembership := &models.RoomMember{
		UserID:   userID,
		RoomID:   roomID,
		JoinedAt: time.Now(),
		IsActive: true,
	}

	if err := r.db.Create(newMembership).Error; err != nil {
		return nil, fmt.Errorf("failed to create membership: %v", err)
	}

	return newMembership, nil
}

// GetMainLobbyChannel gets the main lobby channel for a room
func (r *RoomRepository) GetMainLobbyChannel(roomID uint) (*models.Channel, error) {
	var channel models.Channel
	err := r.db.Where("room_id = ? AND is_main_lobby = ?", roomID, true).First(&channel).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("main lobby channel not found")
		}
		return nil, fmt.Errorf("failed to get main lobby channel: %v", err)
	}
	return &channel, nil
}