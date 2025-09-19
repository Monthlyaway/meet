# API Specification

### REST API Specification

```yaml
openapi: 3.0.0
info:
  title: Gaming Voice Chat API
  version: 1.0.0
  description: Simple REST API for gaming voice chat with token-based room access
servers:
  - url: http://localhost:8080
    description: Local development server

paths:
  # Authentication Endpoints
  /api/auth/register:
    post:
      summary: Register new user account
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                username:
                  type: string
                  minLength: 3
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 6
              required: [username, email, password]
      responses:
        201:
          description: User registered successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  user:
                    $ref: '#/components/schemas/User'
                  token:
                    type: string
        400:
          description: Invalid input or user already exists

  /api/auth/login:
    post:
      summary: User login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
              required: [email, password]
      responses:
        200:
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  user:
                    $ref: '#/components/schemas/User'
                  token:
                    type: string
        401:
          description: Invalid credentials

  # Room Management Endpoints
  /api/rooms:
    post:
      summary: Create new gaming room
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                  minLength: 1
              required: [name]
      responses:
        201:
          description: Room created successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  room:
                    $ref: '#/components/schemas/Room'
                  accessToken:
                    type: string
                    format: uuid

  /api/rooms/join:
    post:
      summary: Join room using access token
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                accessToken:
                  type: string
                  format: uuid
              required: [accessToken]
      responses:
        200:
          description: Successfully joined room
          content:
            application/json:
              schema:
                type: object
                properties:
                  room:
                    $ref: '#/components/schemas/RoomWithChannels'
                  livekitToken:
                    type: string
        404:
          description: Invalid access token

  /api/rooms/{roomId}/channels:
    post:
      summary: Create team channel (admin only)
      security:
        - BearerAuth: []
      parameters:
        - name: roomId
          in: path
          required: true
          schema:
            type: integer
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                  minLength: 1
              required: [name]
      responses:
        201:
          description: Channel created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Channel'
        403:
          description: Only room creator can create channels
        409:
          description: Channel name already exists in this room

  /api/channels/{channelId}/join:
    post:
      summary: Switch to different channel
      security:
        - BearerAuth: []
      parameters:
        - name: channelId
          in: path
          required: true
          schema:
            type: integer
      responses:
        200:
          description: Successfully switched channel
          content:
            application/json:
              schema:
                type: object
                properties:
                  channel:
                    $ref: '#/components/schemas/Channel'
                  livekitToken:
                    type: string
        403:
          description: User not member of room containing this channel

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
        username:
          type: string
        email:
          type: string
        createdAt:
          type: string
          format: date-time

    Room:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
        creatorId:
          type: integer
        createdAt:
          type: string
          format: date-time

    RoomWithChannels:
      allOf:
        - $ref: '#/components/schemas/Room'
        - type: object
          properties:
            channels:
              type: array
              items:
                $ref: '#/components/schemas/Channel'

    Channel:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
        roomId:
          type: integer
        isMainLobby:
          type: boolean
        livekitRoomName:
          type: string
        createdAt:
          type: string
          format: date-time
```
