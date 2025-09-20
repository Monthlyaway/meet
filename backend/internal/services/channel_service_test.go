package services

import (
	"testing"

	"github.com/livekit/meet/backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// Add the missing methods to MockRoomRepository for channel tests
func (m *MockRoomRepository) GetChannelByID(channelID uint) (*models.Channel, error) {
	args := m.Called(channelID)
	return args.Get(0).(*models.Channel), args.Error(1)
}

func (m *MockRoomRepository) SwitchUserChannel(userID uint, newChannelID uint) (*models.UserChannel, error) {
	args := m.Called(userID, newChannelID)
	return args.Get(0).(*models.UserChannel), args.Error(1)
}

func (m *MockRoomRepository) GetChannelMembers(channelID uint) ([]models.UserChannel, error) {
	args := m.Called(channelID)
	return args.Get(0).([]models.UserChannel), args.Error(1)
}

func (m *MockRoomRepository) GetUserCurrentChannel(userID uint) (*models.UserChannel, error) {
	args := m.Called(userID)
	return args.Get(0).(*models.UserChannel), args.Error(1)
}

func (m *MockRoomRepository) DeleteChannel(channelID uint) error {
	args := m.Called(channelID)
	return args.Error(0)
}

func TestSwitchToChannel_Success(t *testing.T) {
	// Arrange
	mockRoomRepo := new(MockRoomRepository)
	mockUserRepo := new(MockUserRepository)
	service := NewChannelService(mockRoomRepo, mockUserRepo)

	userID := uint(1)
	channelID := uint(2)

	mockChannel := &models.Channel{
		ID: 2, Name: "Team Alpha", RoomID: 1,
		IsMainLobby: false, LivekitRoomName: "room_1_channel_team_alpha",
	}
	mockUserChannel := &models.UserChannel{
		ID: 1, UserID: userID, ChannelID: channelID,
		LivekitParticipantID: "user_1_987654321",
		Channel: *mockChannel,
	}

	// Setup mocks
	mockRoomRepo.On("GetChannelByID", channelID).Return(mockChannel, nil)
	mockRoomRepo.On("SwitchUserChannel", userID, channelID).Return(mockUserChannel, nil)

	// Act
	result, err := service.SwitchToChannel(userID, channelID)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, channelID, result.ChannelID)
	assert.Equal(t, "Team Alpha", result.Channel.Name)
	assert.Contains(t, result.LivekitParticipantID, "user_1_")

	mockRoomRepo.AssertCalled(t, "GetChannelByID", channelID)
	mockRoomRepo.AssertCalled(t, "SwitchUserChannel", userID, channelID)
}

func TestSwitchToChannel_ChannelNotFound(t *testing.T) {
	// Arrange
	mockRoomRepo := new(MockRoomRepository)
	mockUserRepo := new(MockUserRepository)
	service := NewChannelService(mockRoomRepo, mockUserRepo)

	userID := uint(1)
	channelID := uint(999)

	// Mock channel not found
	mockRoomRepo.On("GetChannelByID", channelID).Return((*models.Channel)(nil), assert.AnError)

	// Act
	result, err := service.SwitchToChannel(userID, channelID)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "channel not found")
}

func TestCreateTeamChannel_Success(t *testing.T) {
	// Arrange
	mockRoomRepo := new(MockRoomRepository)
	mockUserRepo := new(MockUserRepository)
	service := NewChannelService(mockRoomRepo, mockUserRepo)

	roomID := uint(1)
	creatorID := uint(1)
	channelName := "Team Bravo"

	// Setup mocks
	mockRoomRepo.On("IsRoomOwner", roomID, creatorID).Return(true, nil)
	mockRoomRepo.On("CreateChannel", mock.MatchedBy(func(channel *models.Channel) bool {
		return channel.Name == channelName && channel.IsMainLobby == false
	})).Return(nil)

	// Act
	result, err := service.CreateTeamChannel(roomID, creatorID, channelName)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, channelName, result.Name)
	assert.False(t, result.IsMainLobby)
	assert.Contains(t, result.LivekitRoomName, "room_1_channel_Team Bravo")

	mockRoomRepo.AssertCalled(t, "IsRoomOwner", roomID, creatorID)
	mockRoomRepo.AssertCalled(t, "CreateChannel", mock.AnythingOfType("*models.Channel"))
}

func TestCreateTeamChannel_Unauthorized(t *testing.T) {
	// Arrange
	mockRoomRepo := new(MockRoomRepository)
	mockUserRepo := new(MockUserRepository)
	service := NewChannelService(mockRoomRepo, mockUserRepo)

	roomID := uint(1)
	nonOwnerID := uint(2)
	channelName := "Team Charlie"

	// Mock user is not room owner
	mockRoomRepo.On("IsRoomOwner", roomID, nonOwnerID).Return(false, nil)

	// Act
	result, err := service.CreateTeamChannel(roomID, nonOwnerID, channelName)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "unauthorized: only room creator can create channels")

	// Verify CreateChannel was not called
	mockRoomRepo.AssertNotCalled(t, "CreateChannel", mock.Anything)
}

func TestGetChannelMembers_Success(t *testing.T) {
	// Arrange
	mockRoomRepo := new(MockRoomRepository)
	mockUserRepo := new(MockUserRepository)
	service := NewChannelService(mockRoomRepo, mockUserRepo)

	channelID := uint(1)
	mockUsers := []models.UserChannel{
		{
			ID: 1, UserID: 1, ChannelID: channelID,
			User: models.User{ID: 1, Username: "user1", Email: "user1@example.com"},
		},
		{
			ID: 2, UserID: 2, ChannelID: channelID,
			User: models.User{ID: 2, Username: "user2", Email: "user2@example.com"},
		},
	}

	// Setup mocks
	mockRoomRepo.On("GetChannelMembers", channelID).Return(mockUsers, nil)

	// Act
	result, err := service.GetChannelMembers(channelID)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Len(t, result, 2)
	assert.Equal(t, "user1", result[0].User.Username)
	assert.Equal(t, "user2", result[1].User.Username)

	mockRoomRepo.AssertCalled(t, "GetChannelMembers", channelID)
}

func TestGetUserCurrentChannel_Success(t *testing.T) {
	// Arrange
	mockRoomRepo := new(MockRoomRepository)
	mockUserRepo := new(MockUserRepository)
	service := NewChannelService(mockRoomRepo, mockUserRepo)

	userID := uint(1)
	mockUserChannel := &models.UserChannel{
		ID: 1, UserID: userID, ChannelID: 1,
		Channel: models.Channel{ID: 1, Name: "Main Lobby", IsMainLobby: true},
	}

	// Setup mocks
	mockRoomRepo.On("GetUserCurrentChannel", userID).Return(mockUserChannel, nil)

	// Act
	result, err := service.GetUserCurrentChannel(userID)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, userID, result.UserID)
	assert.Equal(t, "Main Lobby", result.Channel.Name)

	mockRoomRepo.AssertCalled(t, "GetUserCurrentChannel", userID)
}

func TestDeleteTeamChannel_Success(t *testing.T) {
	// Arrange
	mockRoomRepo := new(MockRoomRepository)
	mockUserRepo := new(MockUserRepository)
	service := NewChannelService(mockRoomRepo, mockUserRepo)

	channelID := uint(1)
	userID := uint(1)

	testChannel := &models.Channel{
		ID:          channelID,
		Name:        "Team Alpha",
		RoomID:      1,
		IsMainLobby: false,
	}

	// Setup mocks
	mockRoomRepo.On("GetChannelByID", channelID).Return(testChannel, nil)
	mockRoomRepo.On("IsRoomOwner", testChannel.RoomID, userID).Return(true, nil)
	mockRoomRepo.On("DeleteChannel", channelID).Return(nil)

	// Act
	err := service.DeleteTeamChannel(channelID, userID)

	// Assert
	assert.NoError(t, err)

	mockRoomRepo.AssertCalled(t, "GetChannelByID", channelID)
	mockRoomRepo.AssertCalled(t, "IsRoomOwner", testChannel.RoomID, userID)
	mockRoomRepo.AssertCalled(t, "DeleteChannel", channelID)
}

func TestDeleteTeamChannel_MainLobbyProtection(t *testing.T) {
	// Arrange
	mockRoomRepo := new(MockRoomRepository)
	mockUserRepo := new(MockUserRepository)
	service := NewChannelService(mockRoomRepo, mockUserRepo)

	channelID := uint(1)
	userID := uint(1)

	// Main lobby channel
	testChannel := &models.Channel{
		ID:          channelID,
		Name:        "Main Lobby",
		RoomID:      1,
		IsMainLobby: true, // This is a main lobby
	}

	// Setup mocks
	mockRoomRepo.On("GetChannelByID", channelID).Return(testChannel, nil)

	// Act
	err := service.DeleteTeamChannel(channelID, userID)

	// Assert
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "cannot delete main lobby channel")

	// Verify no further operations were attempted
	mockRoomRepo.AssertNotCalled(t, "IsRoomOwner", mock.Anything, mock.Anything)
	mockRoomRepo.AssertNotCalled(t, "DeleteChannel", mock.Anything)
}

func TestDeleteTeamChannel_Unauthorized(t *testing.T) {
	// Arrange
	mockRoomRepo := new(MockRoomRepository)
	mockUserRepo := new(MockUserRepository)
	service := NewChannelService(mockRoomRepo, mockUserRepo)

	channelID := uint(1)
	userID := uint(2) // Different user, not the owner

	testChannel := &models.Channel{
		ID:          channelID,
		Name:        "Team Alpha",
		RoomID:      1,
		IsMainLobby: false,
	}

	// Setup mocks
	mockRoomRepo.On("GetChannelByID", channelID).Return(testChannel, nil)
	mockRoomRepo.On("IsRoomOwner", testChannel.RoomID, userID).Return(false, nil) // User is not owner

	// Act
	err := service.DeleteTeamChannel(channelID, userID)

	// Assert
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "unauthorized: only room creator can delete channels")

	// Verify delete was not called
	mockRoomRepo.AssertNotCalled(t, "DeleteChannel", mock.Anything)
}

func TestDeleteTeamChannel_ChannelNotFound(t *testing.T) {
	// Arrange
	mockRoomRepo := new(MockRoomRepository)
	mockUserRepo := new(MockUserRepository)
	service := NewChannelService(mockRoomRepo, mockUserRepo)

	channelID := uint(999)
	userID := uint(1)

	// Setup mocks - channel not found
	mockRoomRepo.On("GetChannelByID", channelID).Return((*models.Channel)(nil), assert.AnError)

	// Act
	err := service.DeleteTeamChannel(channelID, userID)

	// Assert
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "channel not found")

	// Verify no further operations were attempted
	mockRoomRepo.AssertNotCalled(t, "IsRoomOwner", mock.Anything, mock.Anything)
	mockRoomRepo.AssertNotCalled(t, "DeleteChannel", mock.Anything)
}