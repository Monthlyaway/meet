package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/livekit/meet/backend/internal/models"
	"github.com/livekit/meet/backend/internal/repositories/interfaces"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockChannelService for testing
type MockChannelService struct {
	mock.Mock
}

// Ensure MockChannelService implements the interface
var _ interfaces.ChannelServiceInterface = (*MockChannelService)(nil)

func (m *MockChannelService) SwitchToChannel(userID uint, channelID uint) (*models.UserChannel, error) {
	args := m.Called(userID, channelID)
	return args.Get(0).(*models.UserChannel), args.Error(1)
}

func (m *MockChannelService) GetChannelMembers(channelID uint) ([]models.UserChannel, error) {
	args := m.Called(channelID)
	return args.Get(0).([]models.UserChannel), args.Error(1)
}

func (m *MockChannelService) GetUserCurrentChannel(userID uint) (*models.UserChannel, error) {
	args := m.Called(userID)
	return args.Get(0).(*models.UserChannel), args.Error(1)
}

func (m *MockChannelService) CreateTeamChannel(roomID uint, creatorID uint, channelName string) (*models.Channel, error) {
	args := m.Called(roomID, creatorID, channelName)
	return args.Get(0).(*models.Channel), args.Error(1)
}

func (m *MockChannelService) DeleteTeamChannel(channelID uint, userID uint) error {
	args := m.Called(channelID, userID)
	return args.Error(0)
}

func (m *MockChannelService) GetRoomChannels(roomID uint) ([]models.Channel, error) {
	args := m.Called(roomID)
	return args.Get(0).([]models.Channel), args.Error(1)
}

func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	return router
}

func TestCreateTeamChannel_Success(t *testing.T) {
	// Setup
	mockService := new(MockChannelService)
	handler := NewChannelHandler(mockService)
	router := setupTestRouter()

	// Mock user
	testUser := &models.User{
		ID:       1,
		Username: "testuser",
		Email:    "test@example.com",
	}

	// Expected channel
	expectedChannel := &models.Channel{
		ID:              1,
		Name:            "Team Alpha",
		RoomID:          1,
		IsMainLobby:     false,
		LivekitRoomName: "room_1_channel_Team Alpha",
	}

	// Setup mock expectations
	mockService.On("CreateTeamChannel", uint(1), uint(1), "Team Alpha").Return(expectedChannel, nil)

	// Setup route with middleware that sets user
	router.POST("/api/rooms/:roomId/channels", func(c *gin.Context) {
		c.Set("user", testUser)
		handler.CreateTeamChannel(c)
	})

	// Prepare request
	requestBody := map[string]string{"name": "Team Alpha"}
	jsonBody, _ := json.Marshal(requestBody)
	req, _ := http.NewRequest("POST", "/api/rooms/1/channels", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	// Execute request
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusCreated, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Team channel created successfully", response["message"])
	assert.NotNil(t, response["channel"])

	mockService.AssertExpectations(t)
}

func TestCreateTeamChannel_Unauthorized(t *testing.T) {
	// Setup
	mockService := new(MockChannelService)
	handler := NewChannelHandler(mockService)
	router := setupTestRouter()

	// Mock user
	testUser := &models.User{
		ID:       1,
		Username: "testuser",
		Email:    "test@example.com",
	}

	// Setup mock expectations - return unauthorized error
	mockService.On("CreateTeamChannel", uint(1), uint(1), "Team Alpha").Return((*models.Channel)(nil), fmt.Errorf("unauthorized: only room creator can create channels"))

	// Setup route
	router.POST("/api/rooms/:roomId/channels", func(c *gin.Context) {
		c.Set("user", testUser)
		handler.CreateTeamChannel(c)
	})

	// Prepare request
	requestBody := map[string]string{"name": "Team Alpha"}
	jsonBody, _ := json.Marshal(requestBody)
	req, _ := http.NewRequest("POST", "/api/rooms/1/channels", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	// Execute request
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusForbidden, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Only room creator can create channels", response["error"])

	mockService.AssertExpectations(t)
}

func TestCreateTeamChannel_InvalidRequest(t *testing.T) {
	// Setup
	mockService := new(MockChannelService)
	handler := NewChannelHandler(mockService)
	router := setupTestRouter()

	// Mock user
	testUser := &models.User{
		ID:       1,
		Username: "testuser",
		Email:    "test@example.com",
	}

	// Setup route
	router.POST("/api/rooms/:roomId/channels", func(c *gin.Context) {
		c.Set("user", testUser)
		handler.CreateTeamChannel(c)
	})

	// Prepare request with empty name
	requestBody := map[string]string{"name": ""}
	jsonBody, _ := json.Marshal(requestBody)
	req, _ := http.NewRequest("POST", "/api/rooms/1/channels", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	// Execute request
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Invalid request format", response["error"])
}

func TestDeleteTeamChannel_Success(t *testing.T) {
	// Setup
	mockService := new(MockChannelService)
	handler := NewChannelHandler(mockService)
	router := setupTestRouter()

	// Mock user
	testUser := &models.User{
		ID:       1,
		Username: "testuser",
		Email:    "test@example.com",
	}

	// Setup mock expectations
	mockService.On("DeleteTeamChannel", uint(1), uint(1)).Return(nil)

	// Setup route
	router.DELETE("/api/channels/:channelId", func(c *gin.Context) {
		c.Set("user", testUser)
		handler.DeleteTeamChannel(c)
	})

	// Execute request
	req, _ := http.NewRequest("DELETE", "/api/channels/1", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusNoContent, w.Code)

	mockService.AssertExpectations(t)
}

func TestDeleteTeamChannel_Unauthorized(t *testing.T) {
	// Setup
	mockService := new(MockChannelService)
	handler := NewChannelHandler(mockService)
	router := setupTestRouter()

	// Mock user
	testUser := &models.User{
		ID:       1,
		Username: "testuser",
		Email:    "test@example.com",
	}

	// Setup mock expectations - return unauthorized error
	mockService.On("DeleteTeamChannel", uint(1), uint(1)).Return(fmt.Errorf("unauthorized: only room creator can delete channels"))

	// Setup route
	router.DELETE("/api/channels/:channelId", func(c *gin.Context) {
		c.Set("user", testUser)
		handler.DeleteTeamChannel(c)
	})

	// Execute request
	req, _ := http.NewRequest("DELETE", "/api/channels/1", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusForbidden, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Only room creator can delete channels", response["error"])

	mockService.AssertExpectations(t)
}

func TestDeleteTeamChannel_MainLobbyProtection(t *testing.T) {
	// Setup
	mockService := new(MockChannelService)
	handler := NewChannelHandler(mockService)
	router := setupTestRouter()

	// Mock user
	testUser := &models.User{
		ID:       1,
		Username: "testuser",
		Email:    "test@example.com",
	}

	// Setup mock expectations - return main lobby protection error
	mockService.On("DeleteTeamChannel", uint(1), uint(1)).Return(fmt.Errorf("cannot delete main lobby channel"))

	// Setup route
	router.DELETE("/api/channels/:channelId", func(c *gin.Context) {
		c.Set("user", testUser)
		handler.DeleteTeamChannel(c)
	})

	// Execute request
	req, _ := http.NewRequest("DELETE", "/api/channels/1", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusConflict, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Cannot delete main lobby channel", response["error"])

	mockService.AssertExpectations(t)
}

func TestDeleteTeamChannel_NotFound(t *testing.T) {
	// Setup
	mockService := new(MockChannelService)
	handler := NewChannelHandler(mockService)
	router := setupTestRouter()

	// Mock user
	testUser := &models.User{
		ID:       1,
		Username: "testuser",
		Email:    "test@example.com",
	}

	// Setup mock expectations - return not found error
	mockService.On("DeleteTeamChannel", uint(1), uint(1)).Return(fmt.Errorf("channel not found"))

	// Setup route
	router.DELETE("/api/channels/:channelId", func(c *gin.Context) {
		c.Set("user", testUser)
		handler.DeleteTeamChannel(c)
	})

	// Execute request
	req, _ := http.NewRequest("DELETE", "/api/channels/1", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusNotFound, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Channel not found", response["error"])

	mockService.AssertExpectations(t)
}

func TestSwitchChannel_Success(t *testing.T) {
	// Setup
	mockService := new(MockChannelService)
	handler := NewChannelHandler(mockService)
	router := setupTestRouter()

	// Mock user
	testUser := &models.User{
		ID:       1,
		Username: "testuser",
		Email:    "test@example.com",
	}

	// Expected user channel
	expectedUserChannel := &models.UserChannel{
		ID:                   1,
		UserID:               1,
		ChannelID:            2,
		LivekitParticipantID: "user_1_123456789",
		Channel: models.Channel{
			ID:              2,
			Name:            "Team Alpha",
			RoomID:          1,
			IsMainLobby:     false,
			LivekitRoomName: "room_1_channel_team_alpha",
		},
	}

	// Setup mock expectations
	mockService.On("SwitchToChannel", uint(1), uint(2)).Return(expectedUserChannel, nil)

	// Setup route with middleware that sets user
	router.POST("/api/channels/:id/join", func(c *gin.Context) {
		c.Set("user", testUser)
		handler.SwitchChannel(c)
	})

	// Execute request
	req, _ := http.NewRequest("POST", "/api/channels/2/join", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Successfully switched channel", response["message"])
	assert.NotNil(t, response["channel"])
	assert.NotNil(t, response["livekitToken"])
	assert.NotNil(t, response["participantId"])

	mockService.AssertExpectations(t)
}

func TestSwitchChannel_UserNotMember(t *testing.T) {
	// Setup
	mockService := new(MockChannelService)
	handler := NewChannelHandler(mockService)
	router := setupTestRouter()

	// Mock user
	testUser := &models.User{
		ID:       1,
		Username: "testuser",
		Email:    "test@example.com",
	}

	// Setup mock expectations - return user not member error
	mockService.On("SwitchToChannel", uint(1), uint(2)).Return((*models.UserChannel)(nil), fmt.Errorf("user not member of room"))

	// Setup route with middleware that sets user
	router.POST("/api/channels/:id/join", func(c *gin.Context) {
		c.Set("user", testUser)
		handler.SwitchChannel(c)
	})

	// Execute request
	req, _ := http.NewRequest("POST", "/api/channels/2/join", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusForbidden, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "User not member of room containing this channel", response["error"])

	mockService.AssertExpectations(t)
}

func TestSwitchChannel_ChannelNotFound(t *testing.T) {
	// Setup
	mockService := new(MockChannelService)
	handler := NewChannelHandler(mockService)
	router := setupTestRouter()

	// Mock user
	testUser := &models.User{
		ID:       1,
		Username: "testuser",
		Email:    "test@example.com",
	}

	// Setup mock expectations - return channel not found error
	mockService.On("SwitchToChannel", uint(1), uint(999)).Return((*models.UserChannel)(nil), fmt.Errorf("channel not found"))

	// Setup route with middleware that sets user
	router.POST("/api/channels/:id/join", func(c *gin.Context) {
		c.Set("user", testUser)
		handler.SwitchChannel(c)
	})

	// Execute request
	req, _ := http.NewRequest("POST", "/api/channels/999/join", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusNotFound, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Channel not found", response["error"])

	mockService.AssertExpectations(t)
}

func TestSwitchChannel_InvalidChannelID(t *testing.T) {
	// Setup
	mockService := new(MockChannelService)
	handler := NewChannelHandler(mockService)
	router := setupTestRouter()

	// Mock user
	testUser := &models.User{
		ID:       1,
		Username: "testuser",
		Email:    "test@example.com",
	}

	// Setup route with middleware that sets user
	router.POST("/api/channels/:id/join", func(c *gin.Context) {
		c.Set("user", testUser)
		handler.SwitchChannel(c)
	})

	// Execute request with invalid channel ID
	req, _ := http.NewRequest("POST", "/api/channels/invalid/join", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Invalid channel ID", response["error"])

	// Verify no service calls were made
	mockService.AssertNotCalled(t, "SwitchToChannel", mock.Anything, mock.Anything)
}