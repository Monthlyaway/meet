package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/livekit/meet/backend/internal/models"
	"github.com/livekit/meet/backend/internal/repositories/interfaces"
)

// ChannelHandler handles channel-related HTTP requests
type ChannelHandler struct {
	channelService interfaces.ChannelServiceInterface
}

// NewChannelHandler creates a new channel handler
func NewChannelHandler(channelService interfaces.ChannelServiceInterface) *ChannelHandler {
	return &ChannelHandler{
		channelService: channelService,
	}
}

// SwitchChannel handles channel switching for users
// POST /api/channels/:id/join
func (h *ChannelHandler) SwitchChannel(c *gin.Context) {
	// Get channel ID from URL parameter
	channelIDStr := c.Param("id")
	channelID, err := strconv.ParseUint(channelIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid channel ID",
		})
		return
	}

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

	// Switch user to the new channel
	userChannel, err := h.channelService.SwitchToChannel(userModel.ID, uint(channelID))
	if err != nil {
		if err.Error() == "channel not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Channel not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to switch channel",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":            "Successfully switched channel",
		"channel":            userChannel.Channel,
		"livekitToken":       userChannel.Channel.LivekitRoomName,
		"participantId":      userChannel.LivekitParticipantID,
	})
}

// GetChannelMembers retrieves all users currently in a channel
// GET /api/channels/:id/members
func (h *ChannelHandler) GetChannelMembers(c *gin.Context) {
	// Get channel ID from URL parameter
	channelIDStr := c.Param("id")
	channelID, err := strconv.ParseUint(channelIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid channel ID",
		})
		return
	}

	// Get channel members
	userChannels, err := h.channelService.GetChannelMembers(uint(channelID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get channel members",
			"details": err.Error(),
		})
		return
	}

	// Convert to response format
	members := make([]gin.H, len(userChannels))
	for i, uc := range userChannels {
		members[i] = gin.H{
			"user":              uc.User.ToResponse(),
			"connectedAt":       uc.ConnectedAt,
			"participantId":     uc.LivekitParticipantID,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"channelId": channelID,
		"members":   members,
	})
}

// CreateTeamChannel creates a new team channel (admin only)
// POST /api/rooms/:roomId/channels
func (h *ChannelHandler) CreateTeamChannel(c *gin.Context) {
	// Get room ID from URL parameter
	roomIDStr := c.Param("roomId")
	roomID, err := strconv.ParseUint(roomIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid room ID",
		})
		return
	}

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

	// Parse request body
	var request struct {
		Name string `json:"name" binding:"required,min=1,max=100"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Create team channel
	channel, err := h.channelService.CreateTeamChannel(uint(roomID), userModel.ID, request.Name)
	if err != nil {
		if err.Error() == "unauthorized: only room creator can create channels" {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Only room creator can create channels",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create team channel",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Team channel created successfully",
		"channel": channel,
	})
}

// DeleteTeamChannel deletes a team channel (admin only)
// DELETE /api/channels/:channelId
func (h *ChannelHandler) DeleteTeamChannel(c *gin.Context) {
	// Get channel ID from URL parameter
	channelIDStr := c.Param("channelId")
	channelID, err := strconv.ParseUint(channelIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid channel ID",
		})
		return
	}

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

	// Delete team channel
	err = h.channelService.DeleteTeamChannel(uint(channelID), userModel.ID)
	if err != nil {
		if err.Error() == "unauthorized: only room creator can delete channels" {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Only room creator can delete channels",
			})
			return
		}

		if err.Error() == "cannot delete main lobby channel" {
			c.JSON(http.StatusConflict, gin.H{
				"error": "Cannot delete main lobby channel",
			})
			return
		}

		if err.Error() == "channel not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Channel not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to delete team channel",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusNoContent, gin.H{})
}

// GetUserCurrentChannel gets the channel a user is currently connected to
// GET /api/user/current-channel
func (h *ChannelHandler) GetUserCurrentChannel(c *gin.Context) {
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

	// Get user's current channel
	userChannel, err := h.channelService.GetUserCurrentChannel(userModel.ID)
	if err != nil {
		if err.Error() == "user not connected to any channel" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "User not connected to any channel",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get current channel",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"channel":       userChannel.Channel,
		"connectedAt":   userChannel.ConnectedAt,
		"participantId": userChannel.LivekitParticipantID,
	})
}