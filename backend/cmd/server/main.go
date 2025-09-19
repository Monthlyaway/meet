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

	// Initialize database connection
	dbConfig := config.LoadDatabaseConfig()
	db, err := dbConfig.ConnectDatabase()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize database schema
	migrator := config.NewDatabaseMigrator(db)
	if err := migrator.InitializeDatabase(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	log.Println("Database connection and schema validated successfully")

	// Setup Gin router
	router := gin.Default()

	// Setup CORS middleware with security headers
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{"http://localhost:3000"} // Allow Next.js dev server
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

	// Initialize services
	authService := services.NewAuthService(userRepo)

	// Initialize handlers
	healthHandler := handlers.NewHealthHandler(db)
	authHandler := handlers.NewAuthHandler(authService)

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
		protectedRoutes.GET("/auth/profile", authHandler.GetProfile)
	}

	// Start server
	address := fmt.Sprintf(":%s", port)
	log.Printf("Server is running on http://localhost%s", address)
	log.Printf("Health check available at: http://localhost%s/health", address)

	if err := router.Run(address); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
