# Backend Architecture

### Service Architecture
```text
backend/
├── cmd/
│   └── server/
│       └── main.go             # Application entry point
├── internal/
│   ├── handlers/               # HTTP request handlers
│   │   ├── auth.go            # Authentication endpoints
│   │   ├── rooms.go           # Room management endpoints
│   │   └── channels.go        # Channel management endpoints
│   ├── services/              # Business logic layer
│   │   ├── auth_service.go    # Authentication business logic
│   │   ├── room_service.go    # Room management logic
│   │   ├── channel_service.go # Channel management logic
│   │   └── livekit_service.go # LiveKit integration
│   ├── repositories/          # Data access layer
│   │   ├── user_repo.go       # User database operations
│   │   ├── room_repo.go       # Room database operations
│   │   └── channel_repo.go    # Channel database operations
│   ├── models/                # Data models
│   ├── middleware/            # HTTP middleware
│   └── config/               # Configuration
├── pkg/                      # Public packages
└── go.mod                    # Go module definition
```

### Database Layer with GORM
```go
// Database initialization with GORM
func InitDB() (*gorm.DB, error) {
    dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
        config.DBUser, config.DBPassword, config.DBHost, config.DBPort, config.DBName)

    db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
    if err != nil {
        return nil, err
    }

    // Auto-migrate models
    err = db.AutoMigrate(&models.User{}, &models.Room{}, &models.Channel{})
    return db, err
}

// Repository pattern with GORM
type UserRepository struct {
    db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
    return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *models.UserRegistration) (*models.User, error) {
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), 12)
    if err != nil {
        return nil, fmt.Errorf("failed to hash password: %w", err)
    }

    newUser := &models.User{
        Username:     user.Username,
        Email:        user.Email,
        PasswordHash: string(hashedPassword),
    }

    if err := r.db.Create(newUser).Error; err != nil {
        return nil, fmt.Errorf("failed to create user: %w", err)
    }

    return newUser, nil
}
```

### Authentication Middleware
```go
func AuthMiddleware(jwtService *jwt.Service) gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
            c.Abort()
            return
        }

        tokenString := strings.TrimPrefix(authHeader, "Bearer ")

        claims, err := jwtService.ValidateToken(tokenString)
        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
            c.Abort()
            return
        }

        c.Set("userID", claims.UserID)
        c.Set("email", claims.Email)
        c.Next()
    }
}
```
