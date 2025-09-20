package models

import (
	"time"
)

// Room represents a gaming room in the system
type Room struct {
	ID          uint      `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	AccessToken string    `json:"access_token" db:"access_token"`
	CreatorID   uint      `json:"creator_id" db:"creator_id"`
	IsActive    bool      `json:"is_active" db:"is_active"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`

	// Related data (loaded separately)
	Creator  *User      `json:"creator,omitempty"`
	Channels []Channel  `json:"channels,omitempty"`
	Members  []User     `json:"members,omitempty"`
}

// Channel represents a voice channel within a room
type Channel struct {
	ID              uint      `json:"id" db:"id"`
	Name            string    `json:"name" db:"name"`
	RoomID          uint      `json:"room_id" db:"room_id"`
	IsMainLobby     bool      `json:"is_main_lobby" db:"is_main_lobby"`
	LivekitRoomName string    `json:"livekit_room_name" db:"livekit_room_name"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
}

// RoomMember represents the many-to-many relationship between users and rooms
type RoomMember struct {
	ID       uint      `json:"id" db:"id"`
	UserID   uint      `json:"user_id" db:"user_id"`
	RoomID   uint      `json:"room_id" db:"room_id"`
	JoinedAt time.Time `json:"joined_at" db:"joined_at"`
	IsActive bool      `json:"is_active" db:"is_active"`
}

// RoomCreation represents the request payload for room creation
type RoomCreation struct {
	Name string `json:"name" binding:"required,min=3,max=100"`
}

// RoomResponse represents the complete room data returned in API responses
type RoomResponse struct {
	ID          uint           `json:"id"`
	Name        string         `json:"name"`
	AccessToken string         `json:"access_token"`
	CreatorID   uint           `json:"creator_id"`
	IsActive    bool           `json:"is_active"`
	CreatedAt   time.Time      `json:"created_at"`
	Creator     *UserResponse  `json:"creator,omitempty"`
	Channels    []Channel      `json:"channels,omitempty"`
	Members     []UserResponse `json:"members,omitempty"`
}

// ToResponse converts a Room to RoomResponse
func (r *Room) ToResponse() RoomResponse {
	resp := RoomResponse{
		ID:          r.ID,
		Name:        r.Name,
		AccessToken: r.AccessToken,
		CreatorID:   r.CreatorID,
		IsActive:    r.IsActive,
		CreatedAt:   r.CreatedAt,
		Channels:    r.Channels,
	}

	// Convert creator if present
	if r.Creator != nil {
		creatorResp := r.Creator.ToResponse()
		resp.Creator = &creatorResp
	}

	// Convert members if present
	if r.Members != nil {
		resp.Members = make([]UserResponse, len(r.Members))
		for i, member := range r.Members {
			resp.Members[i] = member.ToResponse()
		}
	}

	return resp
}