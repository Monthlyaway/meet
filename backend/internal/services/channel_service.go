package services

import (
	"fmt"

	"github.com/livekit/meet/backend/internal/models"
	"github.com/livekit/meet/backend/internal/repositories/interfaces"
)

// ChannelService handles business logic for channel operations
type ChannelService struct {
	roomRepo interfaces.RoomRepositoryInterface
	userRepo interfaces.UserRepositoryInterface
}

// NewChannelService creates a new channel service
func NewChannelService(roomRepo interfaces.RoomRepositoryInterface, userRepo interfaces.UserRepositoryInterface) *ChannelService {
	return &ChannelService{
		roomRepo: roomRepo,
		userRepo: userRepo,
	}
}

// SwitchToChannel moves a user to a different channel within the same room
func (s *ChannelService) SwitchToChannel(userID uint, channelID uint) (*models.UserChannel, error) {
	// 1. Validate that the channel exists
	channel, err := s.roomRepo.GetChannelByID(channelID)
	if err != nil {
		return nil, fmt.Errorf("channel not found: %w", err)
	}

	// 2. Validate that the user is a member of the room containing this channel
	isMember, err := s.roomRepo.IsUserMember(userID, channel.RoomID)
	if err != nil {
		return nil, fmt.Errorf("failed to validate room membership: %w", err)
	}
	if !isMember {
		return nil, fmt.Errorf("user not member of room")
	}

	// 3. Switch the user to the new channel
	userChannel, err := s.roomRepo.SwitchUserChannel(userID, channelID)
	if err != nil {
		return nil, fmt.Errorf("failed to switch channel: %w", err)
	}

	// Log successful channel switch for debugging
	fmt.Printf("User %d switched to channel %d (%s) - participant ID: %s\n",
		userID, channel.ID, channel.Name, userChannel.LivekitParticipantID)

	return userChannel, nil
}

// GetChannelMembers retrieves all users currently in a channel
func (s *ChannelService) GetChannelMembers(channelID uint) ([]models.UserChannel, error) {
	userChannels, err := s.roomRepo.GetChannelMembers(channelID)
	if err != nil {
		return nil, fmt.Errorf("failed to get channel members: %w", err)
	}

	return userChannels, nil
}

// GetUserCurrentChannel gets the channel a user is currently connected to
func (s *ChannelService) GetUserCurrentChannel(userID uint) (*models.UserChannel, error) {
	userChannel, err := s.roomRepo.GetUserCurrentChannel(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user current channel: %w", err)
	}

	return userChannel, nil
}

// CreateTeamChannel creates a new team channel (admin only)
func (s *ChannelService) CreateTeamChannel(roomID uint, creatorID uint, channelName string) (*models.Channel, error) {
	// 1. Validate that the user is the room creator
	isOwner, err := s.roomRepo.IsRoomOwner(roomID, creatorID)
	if err != nil {
		return nil, fmt.Errorf("failed to check room ownership: %w", err)
	}

	if !isOwner {
		return nil, fmt.Errorf("unauthorized: only room creator can create channels")
	}

	// 2. Generate LiveKit room name for the team channel
	livekitRoomName := fmt.Sprintf("room_%d_channel_%s", roomID, channelName)

	// 3. Create the channel
	channel := &models.Channel{
		Name:            channelName,
		RoomID:          roomID,
		IsMainLobby:     false,
		LivekitRoomName: livekitRoomName,
	}

	if err := s.roomRepo.CreateChannel(channel); err != nil {
		return nil, fmt.Errorf("failed to create team channel: %w", err)
	}

	fmt.Printf("Team channel '%s' created in room %d with LiveKit room: %s\n",
		channelName, roomID, livekitRoomName)

	return channel, nil
}

// DeleteTeamChannel deletes a team channel (admin only)
func (s *ChannelService) DeleteTeamChannel(channelID uint, userID uint) error {
	// 1. Get the channel to verify it exists and get room info
	channel, err := s.roomRepo.GetChannelByID(channelID)
	if err != nil {
		return fmt.Errorf("channel not found")
	}

	// 2. Prevent deletion of main lobby channels
	if channel.IsMainLobby {
		return fmt.Errorf("cannot delete main lobby channel")
	}

	// 3. Validate that the user is the room creator
	isOwner, err := s.roomRepo.IsRoomOwner(channel.RoomID, userID)
	if err != nil {
		return fmt.Errorf("failed to check room ownership: %w", err)
	}

	if !isOwner {
		return fmt.Errorf("unauthorized: only room creator can delete channels")
	}

	// 4. Delete the channel (user_channels will cascade delete)
	if err := s.roomRepo.DeleteChannel(channelID); err != nil {
		return fmt.Errorf("failed to delete channel: %w", err)
	}

	fmt.Printf("Team channel '%s' (ID: %d) deleted from room %d\n",
		channel.Name, channelID, channel.RoomID)

	return nil
}

// GetRoomChannels retrieves all channels for a room
func (s *ChannelService) GetRoomChannels(roomID uint) ([]models.Channel, error) {
	channels, err := s.roomRepo.GetRoomChannels(roomID)
	if err != nil {
		return nil, fmt.Errorf("failed to get room channels: %w", err)
	}

	return channels, nil
}