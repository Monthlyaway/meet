package models

import (
	"time"
)

// Room represents a gaming room in the system
type Room struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name" gorm:"size:100"`
	AccessToken string    `json:"access_token" gorm:"uniqueIndex;size:255"`
	CreatorID   uint      `json:"creator_id" gorm:"index"`
	IsActive    bool      `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// GORM Relationships
	Creator  *User      `json:"creator,omitempty" gorm:"foreignKey:CreatorID"`
	Channels []Channel  `json:"channels,omitempty" gorm:"foreignKey:RoomID"`
	Members  []User     `json:"members,omitempty" gorm:"many2many:room_members"`
}

// Channel represents a voice channel within a room
type Channel struct {
	ID              uint      `json:"id" gorm:"primaryKey"`
	Name            string    `json:"name" gorm:"size:100"`
	RoomID          uint      `json:"room_id" gorm:"index"`
	IsMainLobby     bool      `json:"is_main_lobby" gorm:"default:false"`
	LivekitRoomName string    `json:"livekit_room_name" gorm:"size:255"`
	CreatedAt       time.Time `json:"created_at"`

	// GORM Relationships
	Room Room `json:"room,omitempty" gorm:"foreignKey:RoomID"`
}

// RoomMember represents the many-to-many relationship between users and rooms
type RoomMember struct {
	ID       uint      `json:"id" gorm:"primaryKey"`
	UserID   uint      `json:"user_id" gorm:"index"`
	RoomID   uint      `json:"room_id" gorm:"index"`
	JoinedAt time.Time `json:"joined_at"`
	IsActive bool      `json:"is_active" gorm:"default:true"`
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

// RoomJoin represents the request payload for room joining
type RoomJoin struct {
	AccessToken string `json:"accessToken" binding:"required"`
}

// RoomJoinResponse represents the response for successful room joining
type RoomJoinResponse struct {
	Room        RoomResponse `json:"room"`
	LivekitToken string       `json:"livekit_token"`
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