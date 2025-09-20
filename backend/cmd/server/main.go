package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/livekit/meet/backend/internal/config"
	"github.com/livekit/meet/backend/internal/handlers"
	"github.com/livekit/meet/backend/internal/middleware"
	"github.com/livekit/meet/backend/internal/models"
	"github.com/livekit/meet/backend/internal/repositories"
	"github.com/livekit/meet/backend/internal/services"
)

func main() {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Get server configuration from environment
	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}

	ginMode := os.Getenv("GIN_MODE")
	if ginMode == "" {
		ginMode = "debug"
	}
	gin.SetMode(ginMode)

	log.Printf("Starting Gaming Voice Chat Backend Server on port %s (mode: %s)", port, ginMode)

	// Initialize GORM database connection
	dbConfig := config.LoadDatabaseConfig()
	db, err := dbConfig.ConnectGORMDatabase()
	if err != nil {
		log.Fatalf("Failed to connect to GORM database: %v", err)
	}

	// Get underlying sql.DB for deferred close
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("Failed to get underlying sql.DB: %v", err)
	}
	defer sqlDB.Close()

	// Initialize database schema with GORM AutoMigrate
	migrator := config.NewGORMMigrator(db)
	if err := migrator.ValidateGORMConnection(); err != nil {
		log.Fatalf("Failed to validate GORM connection: %v", err)
	}

	// Run GORM AutoMigrate for all models
	if err := migrator.AutoMigrate(&models.User{}, &models.Room{}, &models.Channel{}, &models.RoomMember{}, &models.UserChannel{}); err != nil {
		log.Fatalf("Failed to run GORM AutoMigrate: %v", err)
	}
	log.Println("GORM database connection validated and schema migrated successfully")

	// Setup Gin router
	router := gin.Default()

	// Setup CORS middleware with security headers
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowAllOrigins = true // Disable CORS restrictions
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	corsConfig.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	corsConfig.ExposeHeaders = []string{"Content-Length"}
	corsConfig.AllowCredentials = true
	corsConfig.MaxAge = 12 * 3600 // Cache preflight for 12 hours
	router.Use(cors.New(corsConfig))

	// Add security headers middleware
	router.Use(func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Next()
	})

	// Initialize repositories
	userRepo := repositories.NewUserRepository(db)
	roomRepo := repositories.NewRoomRepository(db)

	// Initialize services
	authService := services.NewAuthService(userRepo)
	roomService := services.NewRoomService(roomRepo, userRepo)
	channelService := services.NewChannelService(roomRepo, userRepo)

	// Initialize handlers
	healthHandler := handlers.NewHealthHandler(sqlDB)
	authHandler := handlers.NewAuthHandler(authService)
	roomHandler := handlers.NewRoomHandler(roomService)
	channelHandler := handlers.NewChannelHandler(channelService)

	// Setup routes
	router.GET("/health", healthHandler.GetHealth)

	// Setup rate limiter for authentication endpoints
	// Allow 5 requests per minute for auth endpoints to prevent brute force attacks
	authRateLimiter := middleware.NewRateLimiter(5.0/60.0, 5) // 5 requests per minute, burst of 5

	// Authentication routes (public) with rate limiting
	authRoutes := router.Group("/api/auth")
	authRoutes.Use(authRateLimiter.Middleware())
	{
		authRoutes.POST("/register", authHandler.Register)
		authRoutes.POST("/login", authHandler.Login)
		authRoutes.POST("/logout", authHandler.Logout)
	}

	// Protected routes (require authentication)
	protectedRoutes := router.Group("/api")
	protectedRoutes.Use(middleware.AuthMiddleware(authService))
	{
		// Authentication routes
		protectedRoutes.GET("/auth/profile", authHandler.GetProfile)

		// Room management routes
		protectedRoutes.POST("/rooms", roomHandler.CreateRoom)
		protectedRoutes.GET("/rooms", roomHandler.GetUserRooms)
		protectedRoutes.GET("/rooms/:id", roomHandler.GetRoom)
		protectedRoutes.DELETE("/rooms/:id", roomHandler.DeleteRoom)
		protectedRoutes.POST("/rooms/join", roomHandler.JoinRoom)

		// Channel management routes
		protectedRoutes.POST("/channels/:id/join", channelHandler.SwitchChannel)
		protectedRoutes.GET("/channels/:id/members", channelHandler.GetChannelMembers)
		protectedRoutes.POST("/rooms/:roomId/channels", channelHandler.CreateTeamChannel)
		protectedRoutes.DELETE("/channels/:channelId", channelHandler.DeleteTeamChannel)
		protectedRoutes.GET("/user/current-channel", channelHandler.GetUserCurrentChannel)
	}

	// Start server
	address := fmt.Sprintf(":%s", port)
	log.Printf("Server is running on http://localhost%s", address)
	log.Printf("Health check available at: http://localhost%s/health", address)

	if err := router.Run(address); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
