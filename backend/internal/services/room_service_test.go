package services

import (
	"testing"

	"github.com/livekit/meet/backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockRoomRepository is a mock implementation of RoomRepositoryInterface
type MockRoomRepository struct {
	mock.Mock
}

func (m *MockRoomRepository) CreateRoom(room *models.Room) error {
	args := m.Called(room)
	return args.Error(0)
}

func (m *MockRoomRepository) CreateChannel(channel *models.Channel) error {
	args := m.Called(channel)
	return args.Error(0)
}

func (m *MockRoomRepository) GetRoomByID(id uint) (*models.Room, error) {
	args := m.Called(id)
	return args.Get(0).(*models.Room), args.Error(1)
}

func (m *MockRoomRepository) GetMainLobbyChannel(roomID uint) (*models.Channel, error) {
	args := m.Called(roomID)
	return args.Get(0).(*models.Channel), args.Error(1)
}

func (m *MockRoomRepository) ConnectUserToMainLobby(userID uint, roomID uint) (*models.UserChannel, error) {
	args := m.Called(userID, roomID)
	return args.Get(0).(*models.UserChannel), args.Error(1)
}

func (m *MockRoomRepository) FindByAccessToken(accessToken string) (*models.Room, error) {
	args := m.Called(accessToken)
	return args.Get(0).(*models.Room), args.Error(1)
}

func (m *MockRoomRepository) CreateOrUpdateMembership(userID, roomID uint) (*models.RoomMember, error) {
	args := m.Called(userID, roomID)
	return args.Get(0).(*models.RoomMember), args.Error(1)
}

func (m *MockRoomRepository) GetRoomChannels(roomID uint) ([]models.Channel, error) {
	args := m.Called(roomID)
	return args.Get(0).([]models.Channel), args.Error(1)
}

func (m *MockRoomRepository) GetUserRooms(userID uint) ([]models.Room, error) {
	args := m.Called(userID)
	return args.Get(0).([]models.Room), args.Error(1)
}

func (m *MockRoomRepository) DeleteRoom(roomID uint) error {
	args := m.Called(roomID)
	return args.Error(0)
}

func (m *MockRoomRepository) IsRoomOwner(roomID, userID uint) (bool, error) {
	args := m.Called(roomID, userID)
	return args.Bool(0), args.Error(1)
}

func (m *MockRoomRepository) GetRoomByAccessToken(token string) (*models.Room, error) {
	args := m.Called(token)
	return args.Get(0).(*models.Room), args.Error(1)
}

// MockUserRepository is a mock implementation of UserRepositoryInterface
type MockUserRepository struct {
	mock.Mock
}

func (m *MockUserRepository) GetByID(id uint) (*models.User, error) {
	args := m.Called(id)
	return args.Get(0).(*models.User), args.Error(1)
}

func TestCreateRoom_CreatesMainLobbyChannel(t *testing.T) {
	// Arrange
	mockRoomRepo := new(MockRoomRepository)
	mockUserRepo := new(MockUserRepository)
	service := NewRoomService(mockRoomRepo, mockUserRepo)

	roomCreation := &models.RoomCreation{
		Name: "Test Gaming Room",
	}
	creatorID := uint(1)

	// Mock room creation
	mockRoomRepo.On("CreateRoom", mock.AnythingOfType("*models.Room")).Return(nil)

	// Mock main lobby channel creation
	mockRoomRepo.On("CreateChannel", mock.MatchedBy(func(channel *models.Channel) bool {
		return channel.Name == "Main Lobby" && channel.IsMainLobby == true
	})).Return(nil)

	// Mock getting room with details
	mockUser := &models.User{ID: 1, Username: "testuser", Email: "test@example.com"}
	mockChannels := []models.Channel{
		{ID: 1, Name: "Main Lobby", IsMainLobby: true, LivekitRoomName: "test-main-lobby"},
	}
	mockRoom := &models.Room{
		ID: 1, Name: "Test Gaming Room", CreatorID: 1,
		Creator: mockUser, Channels: mockChannels,
	}

	mockRoomRepo.On("GetRoomByID", mock.AnythingOfType("uint")).Return(mockRoom, nil)
	mockRoomRepo.On("GetRoomChannels", mock.AnythingOfType("uint")).Return(mockChannels, nil)
	mockUserRepo.On("GetByID", uint(1)).Return(mockUser, nil)

	// Act
	room, err := service.CreateRoom(roomCreation, creatorID)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, room)
	assert.Equal(t, "Test Gaming Room", room.Name)

	// Verify that CreateChannel was called with main lobby channel
	mockRoomRepo.AssertCalled(t, "CreateChannel", mock.MatchedBy(func(channel *models.Channel) bool {
		return channel.Name == "Main Lobby" && channel.IsMainLobby == true
	}))
}

func TestJoinRoom_ConnectsToMainLobby(t *testing.T) {
	// Arrange
	mockRoomRepo := new(MockRoomRepository)
	mockUserRepo := new(MockUserRepository)
	service := NewRoomService(mockRoomRepo, mockUserRepo)

	userID := uint(1)
	accessToken := "test-access-token"

	// Mock room data
	mockRoom := &models.Room{
		ID: 1, Name: "Test Room", AccessToken: accessToken,
		CreatorID: 2, IsActive: true,
	}
	mockMainLobby := &models.Channel{
		ID: 1, Name: "Main Lobby", RoomID: 1,
		IsMainLobby: true, LivekitRoomName: "room_1_main_lobby",
	}
	mockRoomMember := &models.RoomMember{
		ID: 1, UserID: userID, RoomID: 1, IsActive: true,
	}
	mockUserChannel := &models.UserChannel{
		ID: 1, UserID: userID, ChannelID: 1,
		LivekitParticipantID: "user_1_123456789",
	}
	mockCreator := &models.User{ID: 2, Username: "creator", Email: "creator@example.com"}

	// Setup mocks
	mockRoomRepo.On("FindByAccessToken", accessToken).Return(mockRoom, nil)
	mockRoomRepo.On("CreateOrUpdateMembership", userID, uint(1)).Return(mockRoomMember, nil)
	mockRoomRepo.On("ConnectUserToMainLobby", userID, uint(1)).Return(mockUserChannel, nil)
	mockRoomRepo.On("GetMainLobbyChannel", uint(1)).Return(mockMainLobby, nil)
	mockUserRepo.On("GetByID", uint(2)).Return(mockCreator, nil)

	// Act
	response, err := service.JoinRoom(userID, accessToken)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, response)
	assert.Equal(t, "Test Room", response.Room.Name)
	assert.Equal(t, "Main Lobby", response.MainLobbyChannel.Name)
	assert.Equal(t, "room_1_main_lobby", response.LivekitToken)

	// Verify main lobby connection was called
	mockRoomRepo.AssertCalled(t, "ConnectUserToMainLobby", userID, uint(1))
}

func TestJoinRoom_InvalidAccessToken(t *testing.T) {
	// Arrange
	mockRoomRepo := new(MockRoomRepository)
	mockUserRepo := new(MockUserRepository)
	service := NewRoomService(mockRoomRepo, mockUserRepo)

	userID := uint(1)
	invalidToken := "invalid-token"

	// Mock room not found
	mockRoomRepo.On("FindByAccessToken", invalidToken).Return((*models.Room)(nil), assert.AnError)

	// Act
	response, err := service.JoinRoom(userID, invalidToken)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, response)
	assert.Contains(t, err.Error(), "invalid access token")
}