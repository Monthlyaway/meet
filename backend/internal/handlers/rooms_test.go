package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/livekit/meet/backend/internal/interfaces"
	"github.com/livekit/meet/backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockRoomService for testing
type MockRoomService struct {
	mock.Mock
}

// Ensure MockRoomService implements RoomServiceInterface
var _ interfaces.RoomServiceInterface = (*MockRoomService)(nil)

func (m *MockRoomService) CreateRoom(roomData *models.RoomCreation, creatorID uint) (*models.Room, error) {
	args := m.Called(roomData, creatorID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Room), args.Error(1)
}

func (m *MockRoomService) GetUserRooms(userID uint) ([]models.Room, error) {
	args := m.Called(userID)
	return args.Get(0).([]models.Room), args.Error(1)
}

func (m *MockRoomService) GetRoomWithDetails(roomID uint) (*models.Room, error) {
	args := m.Called(roomID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Room), args.Error(1)
}

func (m *MockRoomService) DeleteRoom(roomID, userID uint) error {
	args := m.Called(roomID, userID)
	return args.Error(0)
}

func (m *MockRoomService) ValidateRoomAccess(roomID, userID uint) (bool, error) {
	args := m.Called(roomID, userID)
	return args.Bool(0), args.Error(1)
}

func (m *MockRoomService) JoinRoom(userID uint, accessToken string) (*models.RoomJoinResponse, error) {
	args := m.Called(userID, accessToken)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.RoomJoinResponse), args.Error(1)
}

func TestCreateRoom(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("successful room creation", func(t *testing.T) {
		// Setup
		mockService := new(MockRoomService)
		handler := NewRoomHandler(mockService)

		// Mock data
		testUser := &models.User{
			ID:       1,
			Username: "testuser",
			Email:    "test@example.com",
		}

		roomCreation := models.RoomCreation{
			Name: "Test Gaming Room",
		}

		expectedRoom := &models.Room{
			ID:          1,
			Name:        "Test Gaming Room",
			AccessToken: "test-token-123",
			CreatorID:   1,
			IsActive:    true,
		}

		mockService.On("CreateRoom", &roomCreation, uint(1)).Return(expectedRoom, nil)

		// Create request
		roomData, _ := json.Marshal(roomCreation)
		req := httptest.NewRequest("POST", "/api/rooms", bytes.NewBuffer(roomData))
		req.Header.Set("Content-Type", "application/json")

		// Create gin context with user
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = req
		c.Set("user", testUser)

		// Execute
		handler.CreateRoom(c)

		// Assert
		assert.Equal(t, http.StatusCreated, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Room created successfully", response["message"])
		assert.Equal(t, "test-token-123", response["accessToken"])

		room := response["room"].(map[string]interface{})
		assert.Equal(t, "Test Gaming Room", room["name"])

		mockService.AssertExpectations(t)
	})

	t.Run("invalid request body", func(t *testing.T) {
		// Setup
		mockService := new(MockRoomService)
		handler := NewRoomHandler(mockService)

		testUser := &models.User{ID: 1}

		// Create invalid request (missing required field)
		req := httptest.NewRequest("POST", "/api/rooms", bytes.NewBuffer([]byte(`{"invalid": "data"}`)))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = req
		c.Set("user", testUser)

		// Execute
		handler.CreateRoom(c)

		// Assert
		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Invalid request format", response["error"])
	})

	t.Run("missing authentication", func(t *testing.T) {
		// Setup
		mockService := new(MockRoomService)
		handler := NewRoomHandler(mockService)

		roomCreation := models.RoomCreation{Name: "Test Room"}
		roomData, _ := json.Marshal(roomCreation)

		req := httptest.NewRequest("POST", "/api/rooms", bytes.NewBuffer(roomData))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = req
		// Don't set user in context

		// Execute
		handler.CreateRoom(c)

		// Assert
		assert.Equal(t, http.StatusUnauthorized, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Authentication required", response["error"])
	})
}

func TestGetUserRooms(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("successful rooms retrieval", func(t *testing.T) {
		// Setup
		mockService := new(MockRoomService)
		handler := NewRoomHandler(mockService)

		testUser := &models.User{
			ID:       1,
			Username: "testuser",
		}

		expectedRooms := []models.Room{
			{
				ID:          1,
				Name:        "Room 1",
				AccessToken: "token-1",
				CreatorID:   1,
				IsActive:    true,
			},
			{
				ID:          2,
				Name:        "Room 2",
				AccessToken: "token-2",
				CreatorID:   1,
				IsActive:    true,
			},
		}

		mockService.On("GetUserRooms", uint(1)).Return(expectedRooms, nil)

		// Create request
		req := httptest.NewRequest("GET", "/api/rooms", nil)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = req
		c.Set("user", testUser)

		// Execute
		handler.GetUserRooms(c)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		rooms := response["rooms"].([]interface{})
		assert.Len(t, rooms, 2)

		room1 := rooms[0].(map[string]interface{})
		assert.Equal(t, "Room 1", room1["name"])

		mockService.AssertExpectations(t)
	})
}

func TestDeleteRoom(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("successful room deletion", func(t *testing.T) {
		// Setup
		mockService := new(MockRoomService)
		handler := NewRoomHandler(mockService)

		testUser := &models.User{ID: 1}

		mockService.On("DeleteRoom", uint(1), uint(1)).Return(nil)

		// Create request
		req := httptest.NewRequest("DELETE", "/api/rooms/1", nil)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = req
		c.Set("user", testUser)
		c.Params = gin.Params{gin.Param{Key: "id", Value: "1"}}

		// Execute
		handler.DeleteRoom(c)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Room deleted successfully", response["message"])

		mockService.AssertExpectations(t)
	})

	t.Run("invalid room ID", func(t *testing.T) {
		// Setup
		mockService := new(MockRoomService)
		handler := NewRoomHandler(mockService)

		testUser := &models.User{ID: 1}

		// Create request with invalid ID
		req := httptest.NewRequest("DELETE", "/api/rooms/invalid", nil)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = req
		c.Set("user", testUser)
		c.Params = gin.Params{gin.Param{Key: "id", Value: "invalid"}}

		// Execute
		handler.DeleteRoom(c)

		// Assert
		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Invalid room ID", response["error"])
	})
}

func TestJoinRoom(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("successful room join", func(t *testing.T) {
		// Setup
		mockService := new(MockRoomService)
		handler := NewRoomHandler(mockService)

		testUser := &models.User{
			ID:       1,
			Username: "testuser",
			Email:    "test@example.com",
		}

		accessToken := "test-access-token-123"
		roomJoin := models.RoomJoin{
			AccessToken: accessToken,
		}

		expectedJoinResponse := &models.RoomJoinResponse{
			Room: models.RoomResponse{
				ID:          1,
				Name:        "Test Gaming Room",
				AccessToken: accessToken,
				CreatorID:   2,
				IsActive:    true,
				Channels: []models.Channel{
					{
						ID:              1,
						Name:            "Main Lobby",
						RoomID:          1,
						IsMainLobby:     true,
						LivekitRoomName: "test-main-lobby",
					},
				},
			},
			LivekitToken: "test-main-lobby",
		}

		mockService.On("JoinRoom", uint(1), accessToken).Return(expectedJoinResponse, nil)

		// Create request
		roomData, _ := json.Marshal(roomJoin)
		req := httptest.NewRequest("POST", "/api/rooms/join", bytes.NewBuffer(roomData))
		req.Header.Set("Content-Type", "application/json")

		// Create gin context with user
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = req
		c.Set("user", testUser)

		// Execute
		handler.JoinRoom(c)

		// Assert
		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Successfully joined room", response["message"])
		assert.Equal(t, "test-main-lobby", response["livekitRoomName"])

		room := response["room"].(map[string]interface{})
		assert.Equal(t, "Test Gaming Room", room["name"])
		assert.Equal(t, float64(1), room["id"])

		mockService.AssertExpectations(t)
	})

	t.Run("invalid access token", func(t *testing.T) {
		// Setup
		mockService := new(MockRoomService)
		handler := NewRoomHandler(mockService)

		testUser := &models.User{ID: 1}

		roomJoin := models.RoomJoin{
			AccessToken: "invalid-token",
		}

		// Mock service returns error for invalid token
		mockService.On("JoinRoom", uint(1), "invalid-token").Return(nil, fmt.Errorf("invalid access token: room not found"))

		// Create request
		roomData, _ := json.Marshal(roomJoin)
		req := httptest.NewRequest("POST", "/api/rooms/join", bytes.NewBuffer(roomData))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = req
		c.Set("user", testUser)

		// Execute
		handler.JoinRoom(c)

		// Assert
		assert.Equal(t, http.StatusNotFound, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Invalid access token", response["error"])
		assert.Equal(t, "Room not found or access token is invalid", response["message"])

		mockService.AssertExpectations(t)
	})

	t.Run("invalid request body", func(t *testing.T) {
		// Setup
		mockService := new(MockRoomService)
		handler := NewRoomHandler(mockService)

		testUser := &models.User{ID: 1}

		// Create invalid request (missing required field)
		req := httptest.NewRequest("POST", "/api/rooms/join", bytes.NewBuffer([]byte(`{"invalid": "data"}`)))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = req
		c.Set("user", testUser)

		// Execute
		handler.JoinRoom(c)

		// Assert
		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Invalid request format", response["error"])
	})

	t.Run("missing authentication", func(t *testing.T) {
		// Setup
		mockService := new(MockRoomService)
		handler := NewRoomHandler(mockService)

		roomJoin := models.RoomJoin{AccessToken: "test-token"}
		roomData, _ := json.Marshal(roomJoin)

		req := httptest.NewRequest("POST", "/api/rooms/join", bytes.NewBuffer(roomData))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = req
		// Don't set user in context

		// Execute
		handler.JoinRoom(c)

		// Assert
		assert.Equal(t, http.StatusUnauthorized, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Authentication required", response["error"])
	})
}