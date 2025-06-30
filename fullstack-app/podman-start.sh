#!/bin/bash

# CIC to Give - Podman Start Script
# This script helps you easily start the entire application stack with Podman

set -e

echo "🦭 Starting CIC to Give Application Stack with Podman..."
echo "========================================================"

# Check if Podman is installed
if ! command -v podman &> /dev/null; then
    echo "❌ Podman is not installed. Please install Podman first."
    echo "   Ubuntu/Debian: sudo apt install podman"
    echo "   Fedora/RHEL:   sudo dnf install podman"
    echo "   Arch Linux:    sudo pacman -S podman"
    echo "   macOS:         brew install podman"
    exit 1
fi

# Check if podman-compose is available
COMPOSE_CMD=""
if command -v podman-compose &> /dev/null; then
    COMPOSE_CMD="podman-compose"
    echo "✅ Using podman-compose"
elif command -v docker-compose &> /dev/null; then
    # Set up podman socket for docker-compose compatibility
    if [ ! -S "/run/user/$UID/podman/podman.sock" ]; then
        echo "🔌 Starting Podman socket for docker-compose compatibility..."
        systemctl --user enable podman.socket 2>/dev/null || true
        systemctl --user start podman.socket 2>/dev/null || \
        podman system service --time=0 unix:///run/user/$UID/podman/podman.sock &
        sleep 3
    fi
    export DOCKER_HOST=unix:///run/user/$UID/podman/podman.sock
    COMPOSE_CMD="docker-compose"
    echo "✅ Using docker-compose with Podman socket"
else
    echo "❌ Neither podman-compose nor docker-compose is available."
    echo ""
    echo "📦 Installation options for Arch Linux:"
    echo "   Option 1 (Recommended): sudo pacman -S docker-compose"
    echo "   Option 2: sudo pacman -S python-pipx && pipx install podman-compose"
    echo "   Option 3: yay -S podman-compose  # If you have AUR helper"
    echo ""
    echo "After installation, run this script again."
    exit 1
fi

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $port is already in use. Please stop the service using this port."
        return 1
    fi
    return 0
}

# Check required ports
echo "🔍 Checking required ports..."
PORTS_OK=true

if ! check_port 3000; then
    echo "   Port 3000 (Frontend) is occupied"
    PORTS_OK=false
fi

if ! check_port 8080; then
    echo "   Port 8080 (Backend) is occupied"
    PORTS_OK=false
fi

if ! check_port 5432; then
    echo "   Port 5432 (Database) is occupied"
    PORTS_OK=false
fi

if [ "$PORTS_OK" = false ]; then
    echo ""
    echo "❌ Some required ports are occupied. Please free them first."
    echo "   You can use: sudo lsof -i :PORT_NUMBER to find what's using the port"
    echo "   Then: sudo kill -9 PID to stop the process"
    exit 1
fi

echo "✅ All required ports are available"

# Check for rootless setup
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  Running as root. Consider using rootless Podman for better security."
    echo "   Run as regular user for rootless mode."
else
    echo "✅ Running rootless Podman (recommended)"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p ./database
mkdir -p ./backend/uploads
mkdir -p ./frontend/public/uploads

# Make sure the database init script is accessible
chmod +r ./database/init.sql 2>/dev/null || true

# Clean up any existing containers/pods
echo "🧹 Cleaning up existing containers..."
$COMPOSE_CMD down --remove-orphans 2>/dev/null || true

# Alternative: Clean up using podman directly
podman pod stop cictogive 2>/dev/null || true
podman pod rm cictogive 2>/dev/null || true

# Remove old volumes if requested
if [ "$1" = "--clean" ] || [ "$1" = "-c" ]; then
    echo "🗑️  Removing old volumes (clean start)..."
    $COMPOSE_CMD down -v --remove-orphans 2>/dev/null || true
    podman volume prune -f 2>/dev/null || true
fi

# Special Podman rootless configuration
if [ "$EUID" -ne 0 ]; then
    echo "🔧 Configuring rootless Podman..."

    # Check if subuid/subgid are configured
    if ! grep -q "^$USER:" /etc/subuid 2>/dev/null || ! grep -q "^$USER:" /etc/subgid 2>/dev/null; then
        echo "⚠️  Subuid/subgid not configured for rootless."
        echo "   Setting up subuid/subgid automatically..."

        # Try to configure automatically
        if ! grep -q "^$USER:" /etc/subuid 2>/dev/null; then
            echo "$USER:100000:65536" | sudo tee -a /etc/subuid > /dev/null
        fi
        if ! grep -q "^$USER:" /etc/subgid 2>/dev/null; then
            echo "$USER:100000:65536" | sudo tee -a /etc/subgid > /dev/null
        fi

        echo "✅ Subuid/subgid configured. Migrating Podman..."
        podman system migrate 2>/dev/null || true
    fi

    # Enable linger for auto-start
    loginctl enable-linger $USER 2>/dev/null || true
fi

# Build and start services
echo "🔨 Building and starting services with Podman..."
echo "   This may take a few minutes on first run..."

# Build images
$COMPOSE_CMD build --no-cache

# Start services in detached mode
$COMPOSE_CMD up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."

# Wait for database
echo "   Waiting for database..."
timeout=60
while ! $COMPOSE_CMD exec -T database pg_isready -U postgres -d cictogive > /dev/null 2>&1; do
    if [ $timeout -le 0 ]; then
        echo "❌ Database failed to start within 60 seconds"
        $COMPOSE_CMD logs database
        exit 1
    fi
    echo "      Still waiting for database... ($timeout seconds left)"
    sleep 2
    timeout=$((timeout-2))
done
echo "✅ Database is ready"

# Wait for backend
echo "   Waiting for backend..."
timeout=120
while ! curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; do
    if [ $timeout -le 0 ]; then
        echo "❌ Backend failed to start within 120 seconds"
        $COMPOSE_CMD logs backend
        exit 1
    fi
    echo "      Still waiting for backend... ($timeout seconds left)"
    sleep 3
    timeout=$((timeout-3))
done
echo "✅ Backend is ready"

# Wait for frontend
echo "   Waiting for frontend..."
timeout=60
while ! curl -s http://localhost:3000 > /dev/null 2>&1; do
    if [ $timeout -le 0 ]; then
        echo "❌ Frontend failed to start within 60 seconds"
        $COMPOSE_CMD logs frontend
        exit 1
    fi
    echo "      Still waiting for frontend... ($timeout seconds left)"
    sleep 3
    timeout=$((timeout-3))
done
echo "✅ Frontend is ready"

# Show Podman-specific information
echo ""
echo "🦭 Podman-specific information:"
echo "   Pod name: $(podman pod ls --format '{{.Name}}' | grep -E '(cictogive|fullstack)' | head -1 2>/dev/null || echo 'N/A')"
echo "   Rootless: $([ "$EUID" -ne 0 ] && echo 'Yes ✅' || echo 'No (running as root)')"
echo "   Socket: ${DOCKER_HOST:-'N/A'}"
echo "   Compose: $COMPOSE_CMD"

# Show status
echo ""
echo "🎉 CIC to Give is now running with Podman!"
echo "=========================================="
echo "🌐 Frontend:  http://localhost:3000"
echo "🔌 Backend:   http://localhost:8080"
echo "🗄️  Database: localhost:5432"
echo "   - Database: cictogive"
echo "   - Username: postgres"
echo "   - Password: password"
echo ""
echo "📋 Useful Podman commands:"
echo "   View logs:           $COMPOSE_CMD logs -f"
echo "   Stop application:    $COMPOSE_CMD down"
echo "   Restart:             $COMPOSE_CMD restart"
echo "   Clean restart:       ./podman-start.sh --clean"
echo "   Pod status:          podman pod ps"
echo "   Container status:    podman ps"
echo "   System info:         podman info"
echo ""
echo "🐧 Arch Linux specific:"
echo "   Install compose:     sudo pacman -S docker-compose"
echo "   Socket status:       systemctl --user status podman.socket"
echo "   Rootless check:      podman info | grep rootless"
echo ""
echo "🔐 Default test accounts:"
echo "   Username: admin     | Password: password123"
echo "   Username: john_doe  | Password: password123"
echo "   Username: jane_smith| Password: password123"
echo ""
echo "💡 Podman advantages you're using:"
echo "   - Rootless execution (better security)"
echo "   - No daemon required (less resource usage)"
echo "   - Drop-in Docker replacement"
echo "   - Native systemd integration"
echo ""
echo "Press Ctrl+C to stop the application"
echo "=========================================="

# Follow logs
trap 'echo ""; echo "🛑 Stopping application..."; '$COMPOSE_CMD' down; echo "✅ Application stopped"; exit 0' INT

# Show live logs
$COMPOSE_CMD logs -f
