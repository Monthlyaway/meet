package repositories

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/livekit/meet/backend/internal/models"
)

// RoomRepository handles database operations for rooms
type RoomRepository struct {
	db *sql.DB
}

// NewRoomRepository creates a new room repository
func NewRoomRepository(db *sql.DB) *RoomRepository {
	return &RoomRepository{db: db}
}

// CreateRoom creates a new room in the database
func (r *RoomRepository) CreateRoom(room *models.Room) error {
	query := `
		INSERT INTO rooms (name, access_token, creator_id, is_active, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	result, err := r.db.Exec(query, room.Name, room.AccessToken, room.CreatorID, true, now, now)
	if err != nil {
		return fmt.Errorf("failed to create room: %v", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return fmt.Errorf("failed to get room ID: %v", err)
	}

	room.ID = uint(id)
	room.IsActive = true
	room.CreatedAt = now
	room.UpdatedAt = now

	return nil
}

// GetRoomByID retrieves a room by its ID
func (r *RoomRepository) GetRoomByID(id uint) (*models.Room, error) {
	query := `
		SELECT id, name, access_token, creator_id, is_active, created_at, updated_at
		FROM rooms
		WHERE id = ? AND is_active = 1
	`

	room := &models.Room{}
	err := r.db.QueryRow(query, id).Scan(
		&room.ID, &room.Name, &room.AccessToken, &room.CreatorID,
		&room.IsActive, &room.CreatedAt, &room.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("room not found")
		}
		return nil, fmt.Errorf("failed to get room: %v", err)
	}

	return room, nil
}

// GetRoomByAccessToken retrieves a room by its access token
func (r *RoomRepository) GetRoomByAccessToken(token string) (*models.Room, error) {
	query := `
		SELECT id, name, access_token, creator_id, is_active, created_at, updated_at
		FROM rooms
		WHERE access_token = ? AND is_active = 1
	`

	room := &models.Room{}
	err := r.db.QueryRow(query, token).Scan(
		&room.ID, &room.Name, &room.AccessToken, &room.CreatorID,
		&room.IsActive, &room.CreatedAt, &room.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("room not found")
		}
		return nil, fmt.Errorf("failed to get room: %v", err)
	}

	return room, nil
}

// GetUserRooms retrieves all rooms for a specific user (created and joined)
func (r *RoomRepository) GetUserRooms(userID uint) ([]models.Room, error) {
	query := `
		SELECT DISTINCT r.id, r.name, r.access_token, r.creator_id, r.is_active, r.created_at, r.updated_at
		FROM rooms r
		LEFT JOIN room_members rm ON r.id = rm.room_id
		WHERE (r.creator_id = ? OR (rm.user_id = ? AND rm.is_active = 1))
		AND r.is_active = 1
		ORDER BY r.created_at DESC
	`

	rows, err := r.db.Query(query, userID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user rooms: %v", err)
	}
	defer rows.Close()

	var rooms []models.Room
	for rows.Next() {
		var room models.Room
		err := rows.Scan(
			&room.ID, &room.Name, &room.AccessToken, &room.CreatorID,
			&room.IsActive, &room.CreatedAt, &room.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan room: %v", err)
		}
		rooms = append(rooms, room)
	}

	return rooms, nil
}

// DeleteRoom soft deletes a room (sets is_active to false)
func (r *RoomRepository) DeleteRoom(roomID uint) error {
	query := `
		UPDATE rooms
		SET is_active = 0, updated_at = ?
		WHERE id = ?
	`

	_, err := r.db.Exec(query, time.Now(), roomID)
	if err != nil {
		return fmt.Errorf("failed to delete room: %v", err)
	}

	return nil
}

// CreateChannel creates a new channel in a room
func (r *RoomRepository) CreateChannel(channel *models.Channel) error {
	query := `
		INSERT INTO channels (name, room_id, is_main_lobby, livekit_room_name, created_at)
		VALUES (?, ?, ?, ?, ?)
	`

	now := time.Now()
	result, err := r.db.Exec(query, channel.Name, channel.RoomID, channel.IsMainLobby, channel.LivekitRoomName, now)
	if err != nil {
		return fmt.Errorf("failed to create channel: %v", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return fmt.Errorf("failed to get channel ID: %v", err)
	}

	channel.ID = uint(id)
	channel.CreatedAt = now

	return nil
}

// GetRoomChannels retrieves all channels for a room
func (r *RoomRepository) GetRoomChannels(roomID uint) ([]models.Channel, error) {
	query := `
		SELECT id, name, room_id, is_main_lobby, livekit_room_name, created_at
		FROM channels
		WHERE room_id = ?
		ORDER BY is_main_lobby DESC, created_at ASC
	`

	rows, err := r.db.Query(query, roomID)
	if err != nil {
		return nil, fmt.Errorf("failed to get room channels: %v", err)
	}
	defer rows.Close()

	var channels []models.Channel
	for rows.Next() {
		var channel models.Channel
		err := rows.Scan(
			&channel.ID, &channel.Name, &channel.RoomID,
			&channel.IsMainLobby, &channel.LivekitRoomName, &channel.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan channel: %v", err)
		}
		channels = append(channels, channel)
	}

	return channels, nil
}

// IsRoomOwner checks if a user is the owner of a room
func (r *RoomRepository) IsRoomOwner(roomID, userID uint) (bool, error) {
	query := `
		SELECT COUNT(*) FROM rooms
		WHERE id = ? AND creator_id = ? AND is_active = 1
	`

	var count int
	err := r.db.QueryRow(query, roomID, userID).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check room ownership: %v", err)
	}

	return count > 0, nil
}