package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/livekit/meet/backend/internal/interfaces"
	"github.com/livekit/meet/backend/internal/models"
)

// RoomHandler handles room-related HTTP requests
type RoomHandler struct {
	roomService interfaces.RoomServiceInterface
}

// NewRoomHandler creates a new room handler
func NewRoomHandler(roomService interfaces.RoomServiceInterface) *RoomHandler {
	return &RoomHandler{
		roomService: roomService,
	}
}

// CreateRoom handles room creation
// POST /api/rooms
func (h *RoomHandler) CreateRoom(c *gin.Context) {
	// Get user from context (set by auth middleware)
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
		})
		return
	}

	userModel, ok := user.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Internal server error",
		})
		return
	}

	var roomCreation models.RoomCreation
	if err := c.ShouldBindJSON(&roomCreation); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Create room
	room, err := h.roomService.CreateRoom(&roomCreation, userModel.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create room",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":     "Room created successfully",
		"room":        room.ToResponse(),
		"accessToken": room.AccessToken,
	})
}

// GetUserRooms retrieves all rooms for the authenticated user
// GET /api/rooms
func (h *RoomHandler) GetUserRooms(c *gin.Context) {
	// Get user from context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
		})
		return
	}

	userModel, ok := user.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Internal server error",
		})
		return
	}

	// Get user's rooms
	rooms, err := h.roomService.GetUserRooms(userModel.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to retrieve rooms",
			"details": err.Error(),
		})
		return
	}

	// Convert to response format
	roomResponses := make([]models.RoomResponse, len(rooms))
	for i, room := range rooms {
		roomResponses[i] = room.ToResponse()
	}

	c.JSON(http.StatusOK, gin.H{
		"rooms": roomResponses,
	})
}

// GetRoom retrieves a specific room by ID
// GET /api/rooms/:id
func (h *RoomHandler) GetRoom(c *gin.Context) {
	// Get room ID from URL parameter
	roomIDStr := c.Param("id")
	roomID, err := strconv.ParseUint(roomIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid room ID",
		})
		return
	}

	// Get user from context for access validation
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
		})
		return
	}

	userModel, ok := user.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Internal server error",
		})
		return
	}

	// Validate room access
	hasAccess, err := h.roomService.ValidateRoomAccess(uint(roomID), userModel.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to validate room access",
			"details": err.Error(),
		})
		return
	}

	if !hasAccess {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Access denied to this room",
		})
		return
	}

	// Get room details
	room, err := h.roomService.GetRoomWithDetails(uint(roomID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Room not found",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"room": room.ToResponse(),
	})
}

// DeleteRoom deletes a room (only by creator)
// DELETE /api/rooms/:id
func (h *RoomHandler) DeleteRoom(c *gin.Context) {
	// Get room ID from URL parameter
	roomIDStr := c.Param("id")
	roomID, err := strconv.ParseUint(roomIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid room ID",
		})
		return
	}

	// Get user from context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
		})
		return
	}

	userModel, ok := user.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Internal server error",
		})
		return
	}

	// Delete room
	if err := h.roomService.DeleteRoom(uint(roomID), userModel.ID); err != nil {
		if err.Error() == "unauthorized: only room creator can delete the room" {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Only room creator can delete the room",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to delete room",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Room deleted successfully",
	})
}

// JoinRoom handles room joining via access token
// POST /api/rooms/join
func (h *RoomHandler) JoinRoom(c *gin.Context) {
	// Get user from context (set by auth middleware)
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
		})
		return
	}

	userModel, ok := user.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Internal server error",
		})
		return
	}

	var roomJoin models.RoomJoin
	if err := c.ShouldBindJSON(&roomJoin); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Join room using access token
	joinResponse, err := h.roomService.JoinRoom(userModel.ID, roomJoin.AccessToken)
	if err != nil {
		if err.Error() == "invalid access token: room not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Invalid access token",
				"message": "Room not found or access token is invalid",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to join room",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Successfully joined room",
		"room":    joinResponse.Room,
		"livekitRoomName": joinResponse.LivekitToken, // This is actually the LiveKit room name
	})
}