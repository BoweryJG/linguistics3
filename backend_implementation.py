from fastapi import FastAPI, Depends, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import stripe
import jwt
from supabase import create_client, Client
from datetime import datetime, timedelta
import json
import openai
from pydantic import BaseModel
import uuid

# Initialize FastAPI app
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://muilinguistics.netlify.app", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "DELETE", "PATCH", "PUT"],
    allow_headers=["Content-Type", "Authorization", "X-User-ID"],
)

# Initialize Supabase client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
supabase = create_client(supabase_url, supabase_key)

# Initialize Stripe (for subscriptions)
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
stripe_webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")

# Initialize OpenAI
openai.api_key = os.environ.get("OPENAI_API_KEY")

# Initialize Supabase client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
supabase_client = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None

# Define models
class AudioRequest(BaseModel):
    filename: str
    transcription_url: str = None
    duration_seconds: int = None
    conversation_id: str = None

class UserLimit(BaseModel):
    tier: str = "free"
    monthly_quota: int = 10
    max_file_size: int = 25000000
    usage_reset_date: datetime = None

# User authentication middleware
async def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    try:
        # Parse JWT token
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, options={"verify_signature": False})
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication error: {str(e)}")

# Usage tracking functions
async def get_user_limits(user_id: str):
    try:
        response = supabase.table("user_limits").select("*").eq("user_id", user_id).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        else:
            # Create default limits for new user
            default_limits = UserLimit()
            default_limits.usage_reset_date = datetime.now() + timedelta(days=30)
            response = supabase.table("user_limits").insert({
                "user_id": user_id,
                "tier": default_limits.tier,
                "monthly_quota": default_limits.monthly_quota,
                "max_file_size": default_limits.max_file_size,
                "usage_reset_date": default_limits.usage_reset_date.isoformat()
            }).execute()
            return response.data[0] if response.data else default_limits.dict()
    except Exception as e:
        print(f"Error getting user limits: {str(e)}")
        return UserLimit().dict()

async def get_current_usage(user_id: str):
    try:
        # Get reset date
        limits_response = supabase.table("user_limits").select("usage_reset_date").eq("user_id", user_id).execute()
        reset_date = None
        if limits_response.data and len(limits_response.data) > 0:
            reset_date = limits_response.data[0].get("usage_reset_date")
        
        # Count usage since reset date
        query = supabase.table("user_usage").select("id", count="exact").eq("user_id", user_id)
        if reset_date:
            query = query.gte("created_at", reset_date)
        
        response = query.execute()
        return response.count if hasattr(response, 'count') else 0
    except Exception as e:
        print(f"Error getting current usage: {str(e)}")
        return 0

async def log_usage(user_id: str, request_type: str, file_size: int = 0):
    try:
        response = supabase.table("user_usage").insert({
            "user_id": user_id,
            "request_type": request_type,
            "file_size": file_size,
            "created_at": datetime.now().isoformat()
        }).execute()
        return True
    except Exception as e:
        print(f"Error logging usage: {str(e)}")
        return False

async def update_user_limits(user_id: str, limits: dict):
    try:
        response = supabase.table("user_limits").upsert({
            "user_id": user_id,
            **limits
        }).execute()
        return True
    except Exception as e:
        print(f"Error updating user limits: {str(e)}")
        return False

# Helper functions for subscriptions
def get_tier_from_stripe_product(product_id: str):
    try:
        product = stripe.Product.retrieve(product_id)
        return product.metadata.get("tier", "free")
    except Exception as e:
        print(f"Error getting tier from product: {str(e)}")
        return "free"

def get_user_id_from_stripe_customer(customer_id: str):
    try:
        # Query Supabase for the user_id associated with this customer
        response = supabase.table("stripe_customers").select("user_id").eq("customer_id", customer_id).execute()
        if response.data and len(response.data) > 0:
            return response.data[0].get("user_id")
        return None
    except Exception as e:
        print(f"Error getting user from customer: {str(e)}")
        return None

# Subscription event handlers
async def handle_subscription_created(event):
    subscription = event["data"]["object"]
    customer_id = subscription["customer"]
    items = subscription["items"]["data"]
    
    if items and len(items) > 0:
        price = items[0]["price"]
        product_id = price["product"]
        tier = get_tier_from_stripe_product(product_id)
        user_id = get_user_id_from_stripe_customer(customer_id)
        
        if user_id:
            limits = {
                "tier": tier,
                "monthly_quota": 10 if tier == "free" else 50 if tier == "basic" else 250,
                "max_file_size": 25000000 if tier == "free" else 50000000 if tier == "basic" else 100000000,
                "usage_reset_date": datetime.now().isoformat()
            }
            await update_user_limits(user_id, limits)

async def handle_subscription_updated(event):
    await handle_subscription_created(event)  # Same logic applies

async def handle_subscription_deleted(event):
    subscription = event["data"]["object"]
    customer_id = subscription["customer"]
    user_id = get_user_id_from_stripe_customer(customer_id)
    
    if user_id:
        limits = {
            "tier": "free",
            "monthly_quota": 10,
            "max_file_size": 25000000,
            "usage_reset_date": datetime.now().isoformat()
        }
        await update_user_limits(user_id, limits)

# API ROUTES
@app.get("/")
async def root():
    return {"message": "Audio Analysis API is running"}

@app.get("/health")
async def health():
    """Health check endpoint that doesn't require authentication"""
    return {
        "status": "ok",
        "version": "1.0.0",
        "openai_configured": bool(openai.api_key),
        "supabase_configured": bool(supabase_url and supabase_key),
        "stripe_configured": bool(stripe.api_key)
    }

@app.post("/webhook")
async def webhook(request: AudioRequest, user_id: str = Depends(get_current_user)):
    try:
        filename = request.filename
        # For now, assume file size is 5MB (you should get actual size)
        file_size = 5000000
        
        # Check user limits
        limits = await get_user_limits(user_id)
        current_usage = await get_current_usage(user_id)
        
        # Enforce quota limits
        if current_usage >= limits["monthly_quota"]:
            return JSONResponse(
                status_code=403,
                content={"message": "Monthly quota exceeded. Please upgrade your plan."}
            )
        
        # Log the usage
        await log_usage(user_id, "audio_analysis", file_size)
        
        # Process the audio file with OpenAI
        try:
            # Step 1: Transcribe the audio using OpenAI's Whisper API
            print(f"Transcribing audio file: {filename}")
            
            # The filename should be a URL to the audio file in Supabase storage
            transcription_response = openai.Audio.transcribe(
                model="whisper-1",
                file=filename,
                response_format="text"
            )
            
            # Step 2: Analyze the transcription using OpenAI's GPT-4
            print("Analyzing transcription with GPT-4")
            analysis_prompt = f"Analyze the following conversation transcript for a sales call with a doctor or medspa owner in the aesthetic or dental industry:\n\n{transcription_response}\n\nProvide insights on:"
            analysis_prompt += "\n1. Key points discussed\n2. Customer pain points\n3. Objections raised\n4. Next steps\n5. Overall sentiment"
            
            analysis_response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert sales conversation analyzer specializing in medical device and aesthetic product sales to healthcare practitioners."},
                    {"role": "user", "content": analysis_prompt}
                ]
            )
            
            analysis_text = analysis_response.choices[0].message.content
            
            # Step 3: Store the results in Supabase
            # Parse the analysis text to extract structured data
            try:
                # Extract key components from the analysis text
                key_points = []
                pain_points = []
                objections = []
                next_steps = []
                sentiment = "neutral"
                
                # Simple parsing logic - in production you'd want more robust parsing
                for line in analysis_text.split("\n"):
                    if line.lower().startswith("key point") or "key points" in line.lower():
                        key_points.append(line.split(":", 1)[1].strip() if ":" in line else line.strip())
                    elif line.lower().startswith("pain point") or "pain points" in line.lower():
                        pain_points.append(line.split(":", 1)[1].strip() if ":" in line else line.strip())
                    elif line.lower().startswith("objection") or "objections" in line.lower():
                        objections.append(line.split(":", 1)[1].strip() if ":" in line else line.strip())
                    elif line.lower().startswith("next step") or "next steps" in line.lower():
                        next_steps.append(line.split(":", 1)[1].strip() if ":" in line else line.strip())
                    elif "sentiment" in line.lower():
                        if "positive" in line.lower():
                            sentiment = "positive"
                        elif "negative" in line.lower():
                            sentiment = "negative"
                
                # Extract conversation ID from filename if provided
                conversation_id = None
                if request.conversation_id:
                    conversation_id = request.conversation_id
                
                # If we have a conversation ID, update its status throughout the process
                if conversation_id:
                    # Update to transcribing status
                    supabase_client.table('repspheres_conversations').update({'status': 'transcribing'}).eq('id', conversation_id).execute()
                    
                    # After transcription, update to analyzing status
                    supabase_client.table('repspheres_conversations').update({'status': 'analyzing'}).eq('id', conversation_id).execute()
                    
                    # Store results in the new repspheres_linguistics_results table
                    linguistics_data = {
                        'conversation_id': conversation_id,
                        'transcription': transcription_response,
                        'sentiment': sentiment,
                        'key_points': key_points,
                        'pain_points': pain_points,
                        'objections': objections,
                        'next_steps': next_steps,
                        'full_analysis': analysis_text,
                        'created_at': datetime.utcnow().isoformat()
                    }
                    
                    # Insert the results
                    linguistics_result = supabase_client.table('repspheres_linguistics_results').insert(linguistics_data).execute()
                    
                    # Update conversation status to completed
                    supabase_client.table('repspheres_conversations').update({
                        'status': 'completed',
                        'duration_seconds': request.duration_seconds if request.duration_seconds else 0
                    }).eq('id', conversation_id).execute()
            except Exception as store_error:
                print(f"Error storing analysis results: {str(store_error)}")
                if conversation_id:
                    # Update conversation status to error
                    supabase_client.table('repspheres_conversations').update({
                        'status': 'error',
                        'error_message': f"Error storing results: {str(store_error)}"
                    }).eq('id', conversation_id).execute()
            
            return {
                "message": "Processing completed successfully",
                "conversation_id": conversation_id,
                "transcription": transcription_response[:100] + "...",  # Truncated for response
                "analysis_summary": analysis_text[:100] + "...",  # Truncated for response
                "usage": {
                    "current": current_usage + 1,
                    "limit": limits["monthly_quota"]
                }
            }
        except Exception as e:
            print(f"Error processing audio with OpenAI: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"message": f"Error processing audio with OpenAI: {str(e)}"}
            )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Error processing audio: {str(e)}"}
        )

@app.get("/user/usage")
async def get_usage(user_id: str = Depends(get_current_user)):
    try:
        limits = await get_user_limits(user_id)
        current_usage = await get_current_usage(user_id)
        
        return {
            "tier": limits["tier"],
            "usage": current_usage,
            "quota": limits["monthly_quota"],
            "reset_date": limits["usage_reset_date"]
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Error getting usage: {str(e)}"}
        )

@app.post("/stripe-webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, stripe_webhook_secret
        )
        
        # Handle subscription events
        event_type = event["type"]
        if event_type == "customer.subscription.created":
            await handle_subscription_created(event)
        elif event_type == "customer.subscription.updated":
            await handle_subscription_updated(event)
        elif event_type == "customer.subscription.deleted":
            await handle_subscription_deleted(event)
        
        return {"status": "success"}
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"message": f"Webhook error: {str(e)}"}
        )

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    error_msg = str(exc)
    print(f"Error processing request: {error_msg}")
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error", "detail": error_msg}
    )

# For local development
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
