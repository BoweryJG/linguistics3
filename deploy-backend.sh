#!/bin/bash
# Script to deploy the backend to a hosting service

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}===== RepSpheres Backend Deployment Script =====${NC}"
echo "This script will help you deploy the backend to a hosting service."
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed. Please install Python 3 and try again.${NC}"
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}Error: pip3 is not installed. Please install pip3 and try again.${NC}"
    exit 1
fi

# Check if the backend_implementation.py file exists
if [ ! -f "backend_implementation.py" ]; then
    echo -e "${RED}Error: backend_implementation.py not found. Make sure you are in the correct directory.${NC}"
    exit 1
fi

# Create requirements.txt if it doesn't exist
if [ ! -f "requirements.txt" ]; then
    echo -e "${YELLOW}Creating requirements.txt...${NC}"
    cat > requirements.txt << EOF
fastapi==0.95.1
uvicorn==0.22.0
pydantic==1.10.7
python-multipart==0.0.6
python-jose==3.3.0
stripe==5.4.0
supabase==1.0.3
openai==0.27.6
python-dotenv==1.0.0
pyjwt==2.6.0
EOF
    echo -e "${GREEN}requirements.txt created.${NC}"
fi

# Create .env.example if it doesn't exist
if [ ! -f ".env.example" ]; then
    echo -e "${YELLOW}Creating .env.example...${NC}"
    cat > .env.example << EOF
# Supabase configuration
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-service-role-key

# OpenAI configuration
OPENAI_API_KEY=your-openai-api-key

# Stripe configuration (if using subscriptions)
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# CORS configuration
CORS_ORIGINS=https://your-frontend-url.com,http://localhost:5173
EOF
    echo -e "${GREEN}.env.example created.${NC}"
fi

# Create Procfile for Heroku
if [ ! -f "Procfile" ]; then
    echo -e "${YELLOW}Creating Procfile for Heroku...${NC}"
    cat > Procfile << EOF
web: uvicorn backend_implementation:app --host=0.0.0.0 --port=\$PORT
EOF
    echo -e "${GREEN}Procfile created.${NC}"
fi

# Create Dockerfile
if [ ! -f "Dockerfile" ]; then
    echo -e "${YELLOW}Creating Dockerfile...${NC}"
    cat > Dockerfile << EOF
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "backend_implementation:app", "--host", "0.0.0.0", "--port", "8000"]
EOF
    echo -e "${GREEN}Dockerfile created.${NC}"
fi

# Create docker-compose.yml
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${YELLOW}Creating docker-compose.yml...${NC}"
    cat > docker-compose.yml << EOF
version: '3'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    env_file:
      - .env
    restart: always
EOF
    echo -e "${GREEN}docker-compose.yml created.${NC}"
fi

# Create render.yaml for Render.com
if [ ! -f "render.yaml" ]; then
    echo -e "${YELLOW}Creating render.yaml for Render.com...${NC}"
    cat > render.yaml << EOF
services:
  - type: web
    name: repspheres-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn backend_implementation:app --host 0.0.0.0 --port \$PORT
    envVars:
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_KEY
        sync: false
      - key: OPENAI_API_KEY
        sync: false
      - key: STRIPE_SECRET_KEY
        sync: false
      - key: STRIPE_WEBHOOK_SECRET
        sync: false
EOF
    echo -e "${GREEN}render.yaml created.${NC}"
fi

# Create a README.md for the backend
if [ ! -f "BACKEND_README.md" ]; then
    echo -e "${YELLOW}Creating BACKEND_README.md...${NC}"
    cat > BACKEND_README.md << EOF
# RepSpheres Backend

This is the backend for the RepSpheres application, which handles audio transcription and analysis using OpenAI's Whisper and GPT-4 APIs.

## Setup

1. Install the required dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

2. Create a \`.env\` file with the required environment variables (see \`.env.example\`).

3. Run the backend locally:
   \`\`\`bash
   uvicorn backend_implementation:app --reload
   \`\`\`

## Deployment Options

### Render.com

1. Create a new Web Service on Render.com.
2. Connect your GitHub repository.
3. Use the following settings:
   - Build Command: \`pip install -r requirements.txt\`
   - Start Command: \`uvicorn backend_implementation:app --host 0.0.0.0 --port \$PORT\`
4. Add the required environment variables in the Render dashboard.

### Heroku

1. Install the Heroku CLI and log in.
2. Create a new Heroku app:
   \`\`\`bash
   heroku create repspheres-backend
   \`\`\`
3. Set the required environment variables:
   \`\`\`bash
   heroku config:set SUPABASE_URL=your-supabase-url
   heroku config:set SUPABASE_KEY=your-supabase-service-role-key
   heroku config:set OPENAI_API_KEY=your-openai-api-key
   # Add other environment variables as needed
   \`\`\`
4. Deploy the app:
   \`\`\`bash
   git push heroku main
   \`\`\`

### Docker

1. Build the Docker image:
   \`\`\`bash
   docker build -t repspheres-backend .
   \`\`\`
2. Run the container:
   \`\`\`bash
   docker run -p 8000:8000 --env-file .env repspheres-backend
   \`\`\`

Alternatively, use Docker Compose:
\`\`\`bash
docker-compose up
\`\`\`

## API Endpoints

- \`GET /\`: Root endpoint, returns a simple message.
- \`GET /health\`: Health check endpoint, returns the status of the API and its dependencies.
- \`POST /webhook\`: Main endpoint for audio processing. Requires authentication.
- \`GET /user/usage\`: Get the current user's usage statistics. Requires authentication.
- \`POST /stripe-webhook\`: Webhook for Stripe subscription events.

## Environment Variables

- \`SUPABASE_URL\`: URL of your Supabase project.
- \`SUPABASE_KEY\`: Service role key for your Supabase project.
- \`OPENAI_API_KEY\`: API key for OpenAI.
- \`STRIPE_SECRET_KEY\`: Secret key for Stripe (if using subscriptions).
- \`STRIPE_WEBHOOK_SECRET\`: Webhook secret for Stripe (if using subscriptions).
EOF
    echo -e "${GREEN}BACKEND_README.md created.${NC}"
fi

echo ""
echo -e "${GREEN}===== Deployment Files Created =====${NC}"
echo "The following files have been created:"
echo "- requirements.txt: Python dependencies"
echo "- .env.example: Example environment variables"
echo "- Procfile: For Heroku deployment"
echo "- Dockerfile: For Docker deployment"
echo "- docker-compose.yml: For Docker Compose deployment"
echo "- render.yaml: For Render.com deployment"
echo "- BACKEND_README.md: Documentation for the backend"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Create a .env file with your actual environment variables."
echo "2. Choose a deployment option and follow the instructions in BACKEND_README.md."
echo "3. Update the frontend's .env file with the new backend URL."
echo ""
echo -e "${GREEN}Good luck with your deployment!${NC}"
