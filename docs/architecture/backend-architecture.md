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
