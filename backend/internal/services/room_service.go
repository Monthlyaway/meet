package services

import (
	"fmt"

	"github.com/google/uuid"
	"github.com/livekit/meet/backend/internal/models"
	"github.com/livekit/meet/backend/internal/repositories"
)

// RoomService handles business logic for room operations
type RoomService struct {
	roomRepo *repositories.RoomRepository
	userRepo *repositories.UserRepository
}

// NewRoomService creates a new room service
func NewRoomService(roomRepo *repositories.RoomRepository, userRepo *repositories.UserRepository) *RoomService {
	return &RoomService{
		roomRepo: roomRepo,
		userRepo: userRepo,
	}
}

// CreateRoom creates a new gaming room with main lobby channel
func (s *RoomService) CreateRoom(roomData *models.RoomCreation, creatorID uint) (*models.Room, error) {
	// Generate unique access token
	accessToken := uuid.New().String()

	// Create room
	room := &models.Room{
		Name:        roomData.Name,
		AccessToken: accessToken,
		CreatorID:   creatorID,
	}

	// Save room to database
	if err := s.roomRepo.CreateRoom(room); err != nil {
		return nil, fmt.Errorf("failed to create room: %v", err)
	}

	// Create main lobby channel
	mainLobbyName := fmt.Sprintf("%s-main-lobby", room.AccessToken)
	mainChannel := &models.Channel{
		Name:            "Main Lobby",
		RoomID:          room.ID,
		IsMainLobby:     true,
		LivekitRoomName: mainLobbyName,
	}

	if err := s.roomRepo.CreateChannel(mainChannel); err != nil {
		// Critical failure: If main lobby creation fails, room is unusable
		// Clean up the room and return error
		if cleanupErr := s.roomRepo.DeleteRoom(room.ID); cleanupErr != nil {
			fmt.Printf("Critical: Failed to cleanup room %d after channel creation failure: %v\n", room.ID, cleanupErr)
		}
		return nil, fmt.Errorf("failed to create main lobby channel: %v", err)
	}

	// Load room with creator information
	return s.GetRoomWithDetails(room.ID)
}

// GetUserRooms retrieves all rooms for a user with details
func (s *RoomService) GetUserRooms(userID uint) ([]models.Room, error) {
	rooms, err := s.roomRepo.GetUserRooms(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user rooms: %v", err)
	}

	// Load additional details for each room
	for i := range rooms {
		// Load creator information
		creator, err := s.userRepo.GetByID(rooms[i].CreatorID)
		if err == nil {
			rooms[i].Creator = creator
		}

		// Load channels
		channels, err := s.roomRepo.GetRoomChannels(rooms[i].ID)
		if err == nil {
			rooms[i].Channels = channels
		}
	}

	return rooms, nil
}

// GetRoomByID retrieves a room by ID with details
func (s *RoomService) GetRoomWithDetails(roomID uint) (*models.Room, error) {
	room, err := s.roomRepo.GetRoomByID(roomID)
	if err != nil {
		return nil, fmt.Errorf("failed to get room: %v", err)
	}

	// Load creator information
	creator, err := s.userRepo.GetByID(room.CreatorID)
	if err == nil {
		room.Creator = creator
	}

	// Load channels
	channels, err := s.roomRepo.GetRoomChannels(room.ID)
	if err == nil {
		room.Channels = channels
	}

	return room, nil
}

// GetRoomByAccessToken retrieves a room by access token
func (s *RoomService) GetRoomByAccessToken(token string) (*models.Room, error) {
	room, err := s.roomRepo.GetRoomByAccessToken(token)
	if err != nil {
		return nil, fmt.Errorf("failed to get room by token: %v", err)
	}

	return room, nil
}

// DeleteRoom deletes a room (only by owner)
func (s *RoomService) DeleteRoom(roomID, userID uint) error {
	// Check if user is the room owner
	isOwner, err := s.roomRepo.IsRoomOwner(roomID, userID)
	if err != nil {
		return fmt.Errorf("failed to check room ownership: %v", err)
	}

	if !isOwner {
		return fmt.Errorf("unauthorized: only room creator can delete the room")
	}

	// Delete the room (soft delete)
	if err := s.roomRepo.DeleteRoom(roomID); err != nil {
		return fmt.Errorf("failed to delete room: %v", err)
	}

	return nil
}

// ValidateRoomAccess checks if a user can access a room
func (s *RoomService) ValidateRoomAccess(roomID, userID uint) (bool, error) {
	// Check if user is room creator
	isOwner, err := s.roomRepo.IsRoomOwner(roomID, userID)
	if err != nil {
		return false, fmt.Errorf("failed to check room ownership: %v", err)
	}

	if isOwner {
		return true, nil
	}

	// TODO: Add room member validation when member system is implemented
	// For now, we'll allow access to any authenticated user
	return true, nil
}