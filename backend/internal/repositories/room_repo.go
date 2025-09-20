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

// ConnectUserToMainLobby creates a UserChannel record linking user to main lobby
func (r *RoomRepository) ConnectUserToMainLobby(userID uint, roomID uint) (*models.UserChannel, error) {
	// First get the main lobby channel
	mainLobby, err := r.GetMainLobbyChannel(roomID)
	if err != nil {
		return nil, fmt.Errorf("main lobby not found: %w", err)
	}

	// Generate LiveKit participant ID
	participantID := fmt.Sprintf("user_%d_%d", userID, time.Now().Unix())

	// Remove any existing channel connection for this user (unique constraint)
	if err := r.db.Where("user_id = ?", userID).Delete(&models.UserChannel{}).Error; err != nil {
		return nil, fmt.Errorf("failed to remove existing channel connection: %w", err)
	}

	// Create new user channel connection
	userChannel := &models.UserChannel{
		UserID:               userID,
		ChannelID:            mainLobby.ID,
		ConnectedAt:          time.Now(),
		LivekitParticipantID: participantID,
	}

	if err := r.db.Create(userChannel).Error; err != nil {
		return nil, fmt.Errorf("failed to connect user to main lobby: %w", err)
	}

	return userChannel, nil
}

// GetUserCurrentChannel gets the channel a user is currently connected to
func (r *RoomRepository) GetUserCurrentChannel(userID uint) (*models.UserChannel, error) {
	var userChannel models.UserChannel
	err := r.db.Preload("Channel").Where("user_id = ?", userID).First(&userChannel).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("user not connected to any channel")
		}
		return nil, fmt.Errorf("failed to get user current channel: %w", err)
	}
	return &userChannel, nil
}

// GetChannelMembers retrieves all users currently connected to a channel
func (r *RoomRepository) GetChannelMembers(channelID uint) ([]models.UserChannel, error) {
	var userChannels []models.UserChannel
	err := r.db.Preload("User").Where("channel_id = ?", channelID).Find(&userChannels).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get channel members: %w", err)
	}
	return userChannels, nil
}

// GetRoomMembersWithChannels retrieves all users in a room with their current channel info
func (r *RoomRepository) GetRoomMembersWithChannels(roomID uint) ([]models.User, error) {
	var users []models.User

	// Get all active room members
	err := r.db.Table("users").
		Joins("JOIN room_members ON users.id = room_members.user_id").
		Where("room_members.room_id = ? AND room_members.is_active = ?", roomID, true).
		Find(&users).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get room members: %w", err)
	}

	return users, nil
}

// SwitchUserChannel moves a user from their current channel to a new channel
func (r *RoomRepository) SwitchUserChannel(userID uint, newChannelID uint) (*models.UserChannel, error) {
	// Generate new LiveKit participant ID
	participantID := fmt.Sprintf("user_%d_%d", userID, time.Now().Unix())

	// Remove existing channel connection
	if err := r.db.Where("user_id = ?", userID).Delete(&models.UserChannel{}).Error; err != nil {
		return nil, fmt.Errorf("failed to remove existing channel connection: %w", err)
	}

	// Create new channel connection
	userChannel := &models.UserChannel{
		UserID:               userID,
		ChannelID:            newChannelID,
		ConnectedAt:          time.Now(),
		LivekitParticipantID: participantID,
	}

	if err := r.db.Create(userChannel).Error; err != nil {
		return nil, fmt.Errorf("failed to create new channel connection: %w", err)
	}

	// Load the channel information
	if err := r.db.Preload("Channel").First(userChannel, userChannel.ID).Error; err != nil {
		return nil, fmt.Errorf("failed to load channel info: %w", err)
	}

	return userChannel, nil
}

// GetChannelByID retrieves a channel by its ID
func (r *RoomRepository) GetChannelByID(channelID uint) (*models.Channel, error) {
	var channel models.Channel
	err := r.db.First(&channel, channelID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("channel not found")
		}
		return nil, fmt.Errorf("failed to get channel: %w", err)
	}
	return &channel, nil
}

// DeleteChannel deletes a channel by its ID (user_channels cascade delete)
func (r *RoomRepository) DeleteChannel(channelID uint) error {
	err := r.db.Delete(&models.Channel{}, channelID).Error
	if err != nil {
		return fmt.Errorf("failed to delete channel: %w", err)
	}
	return nil
}

// IsUserMember checks if a user is a member of a room
func (r *RoomRepository) IsUserMember(userID, roomID uint) (bool, error) {
	// Check if user is the room owner
	isOwner, err := r.IsRoomOwner(roomID, userID)
	if err != nil {
		return false, fmt.Errorf("failed to check room ownership: %w", err)
	}
	if isOwner {
		return true, nil
	}

	// Check if user has an active membership
	var count int64
	err = r.db.Model(&models.RoomMember{}).
		Where("user_id = ? AND room_id = ? AND is_active = ?", userID, roomID, true).
		Count(&count).Error
	if err != nil {
		return false, fmt.Errorf("failed to check room membership: %w", err)
	}

	return count > 0, nil
}