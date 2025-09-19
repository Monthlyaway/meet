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

	// Setup CORS middleware
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{"http://localhost:3000"} // Allow Next.js dev server
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	corsConfig.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	router.Use(cors.New(corsConfig))

	// Initialize handlers
	healthHandler := handlers.NewHealthHandler(db)

	// Setup routes
	router.GET("/health", healthHandler.GetHealth)

	// Start server
	address := fmt.Sprintf(":%s", port)
	log.Printf("Server is running on http://localhost%s", address)
	log.Printf("Health check available at: http://localhost%s/health", address)

	if err := router.Run(address); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
