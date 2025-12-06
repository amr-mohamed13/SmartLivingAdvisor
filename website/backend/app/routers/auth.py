"""
Authentication routes for FastAPI.
Handles signup, login, OAuth, and token refresh.
"""

from __future__ import annotations

import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from dotenv import load_dotenv
from app.auth import (
    create_access_token,
    create_refresh_token,
    get_current_user,
    hash_password,
    save_refresh_token,
    verify_password,
    verify_refresh_token,
    revoke_refresh_token,
)

load_dotenv()

router = APIRouter(prefix="/auth", tags=["authentication"])


def get_engine() -> Engine:
    """Get database engine."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL environment variable is required.")
    return create_engine(database_url, pool_pre_ping=True)


# Request/Response Models
class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str]
    oauth_provider: Optional[str]


# Routes
@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(request: SignUpRequest):
    """Register a new user with email and password."""
    if len(request.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters"
        )
    
    engine = get_engine()
    
    # Check if user already exists
    with engine.connect() as conn:
        existing = conn.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": request.email.lower()}
        ).mappings().first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )
        
        # Create user
        password_hash = hash_password(request.password)
        result = conn.execute(
            text("""
                INSERT INTO users (email, password_hash, name, oauth_provider)
                VALUES (:email, :password_hash, :name, 'email')
                RETURNING id, email, name, oauth_provider
            """),
            {
                "email": request.email.lower(),
                "password_hash": password_hash,
                "name": request.name
            }
        )
        user = result.mappings().first()
        conn.commit()
    
    # Create tokens
    access_token = create_access_token(data={"sub": user["id"]})
    refresh_token = create_refresh_token(data={"sub": user["id"]})
    save_refresh_token(user["id"], refresh_token)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "oauth_provider": user["oauth_provider"]
        }
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Login with email and password."""
    engine = get_engine()
    
    with engine.connect() as conn:
        user = conn.execute(
            text("SELECT id, email, password_hash, name, oauth_provider FROM users WHERE email = :email"),
            {"email": request.email.lower()}
        ).mappings().first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Check if user has password (not OAuth-only)
        if not user["password_hash"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Please sign in with your OAuth provider"
            )
        
        # Verify password
        if not verify_password(request.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
    
    # Create tokens
    access_token = create_access_token(data={"sub": user["id"]})
    refresh_token = create_refresh_token(data={"sub": user["id"]})
    save_refresh_token(user["id"], refresh_token)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "oauth_provider": user["oauth_provider"]
        }
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user information."""
    return UserResponse(**current_user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshTokenRequest):
    """Refresh access token using refresh token."""
    user_info = verify_refresh_token(request.refresh_token)
    
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    # Create new tokens
    access_token = create_access_token(data={"sub": user_info["user_id"]})
    refresh_token = create_refresh_token(data={"sub": user_info["user_id"]})
    
    # Revoke old token and save new one
    revoke_refresh_token(request.refresh_token)
    save_refresh_token(user_info["user_id"], refresh_token)
    
    # Get user info
    engine = get_engine()
    with engine.connect() as conn:
        user = conn.execute(
            text("SELECT id, email, name, oauth_provider FROM users WHERE id = :user_id"),
            {"user_id": user_info["user_id"]}
        ).mappings().first()
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "oauth_provider": user["oauth_provider"]
        }
    )


@router.post("/logout")
async def logout(request: RefreshTokenRequest):
    """Logout by revoking refresh token."""
    revoke_refresh_token(request.refresh_token)
    return {"message": "Logged out successfully"}


# OAuth Routes (Google)
@router.get("/google/login")
async def google_login():
    """Initiate Google OAuth login."""
    try:
        from authlib.integrations.httpx_client import AsyncOAuth2Client
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OAuth library not installed. Install with: pip install authlib"
        )
    
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")
    
    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth not configured. Set GOOGLE_CLIENT_ID in environment variables."
        )
    
    client = AsyncOAuth2Client(
        client_id=client_id,
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        redirect_uri=redirect_uri
    )
    
    authorization_url, state = client.create_authorization_url(
        "https://accounts.google.com/o/oauth2/v2/auth",
        scope="openid email profile"
    )
    
    # Store state in session/cookie (simplified - in production use secure session)
    return RedirectResponse(url=authorization_url)


@router.get("/google/callback")
async def google_callback(code: str, state: Optional[str] = None):
    """Handle Google OAuth callback."""
    try:
        from authlib.integrations.httpx_client import AsyncOAuth2Client
    except ImportError:
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        return RedirectResponse(f"{frontend_url}/signin?error=oauth_not_installed")
    
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    if not client_id or not client_secret:
        return RedirectResponse(f"{frontend_url}/signin?error=oauth_not_configured")
    
    client = AsyncOAuth2Client(client_id=client_id, client_secret=client_secret)
    
    try:
        token = await client.fetch_token(
            "https://oauth2.googleapis.com/token",
            code=code,
            redirect_uri=redirect_uri
        )
        
        # Get user info from Google
        async with client:
            resp = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                token=token
            )
            google_user = resp.json()
        
        # Find or create user
        engine = get_engine()
        with engine.connect() as conn:
            user = conn.execute(
                text("""
                    SELECT id, email, name, oauth_provider
                    FROM users
                    WHERE oauth_id = :oauth_id AND oauth_provider = 'google'
                """),
                {"oauth_id": google_user["id"]}
            ).mappings().first()
            
            if not user:
                # Check if email exists
                existing_email = conn.execute(
                    text("SELECT id FROM users WHERE email = :email"),
                    {"email": google_user["email"].lower()}
                ).mappings().first()
                
                if existing_email:
                    # Link OAuth to existing account
                    conn.execute(
                        text("""
                            UPDATE users
                            SET oauth_provider = 'google', oauth_id = :oauth_id
                            WHERE id = :user_id
                        """),
                        {
                            "oauth_id": google_user["id"],
                            "user_id": existing_email["id"]
                        }
                    )
                    user_id = existing_email["id"]
                else:
                    # Create new user
                    result = conn.execute(
                        text("""
                            INSERT INTO users (email, name, oauth_provider, oauth_id)
                            VALUES (:email, :name, 'google', :oauth_id)
                            RETURNING id, email, name, oauth_provider
                        """),
                        {
                            "email": google_user["email"].lower(),
                            "name": google_user.get("name"),
                            "oauth_id": google_user["id"]
                        }
                    )
                    user = result.mappings().first()
                    user_id = user["id"]
            else:
                user_id = user["id"]
            
            conn.commit()
        
        # Create tokens
        access_token = create_access_token(data={"sub": user_id})
        refresh_token = create_refresh_token(data={"sub": user_id})
        save_refresh_token(user_id, refresh_token)
        
        # Redirect to frontend with tokens
        return RedirectResponse(
            f"{frontend_url}/auth/callback?access_token={access_token}&refresh_token={refresh_token}"
        )
    
    except Exception as e:
        return RedirectResponse(f"{frontend_url}/signin?error=oauth_failed")


# OAuth Routes (Facebook)
@router.get("/facebook/login")
async def facebook_login():
    """Initiate Facebook OAuth login."""
    client_id = os.getenv("FACEBOOK_CLIENT_ID")
    redirect_uri = os.getenv("FACEBOOK_REDIRECT_URI", "http://localhost:8000/auth/facebook/callback")
    
    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Facebook OAuth not configured. Set FACEBOOK_CLIENT_ID in environment variables."
        )
    
    auth_url = (
        f"https://www.facebook.com/v18.0/dialog/oauth?"
        f"client_id={client_id}&"
        f"redirect_uri={redirect_uri}&"
        f"scope=email,public_profile"
    )
    
    return RedirectResponse(url=auth_url)


@router.get("/facebook/callback")
async def facebook_callback(code: str):
    """Handle Facebook OAuth callback."""
    import httpx
    
    client_id = os.getenv("FACEBOOK_CLIENT_ID")
    client_secret = os.getenv("FACEBOOK_CLIENT_SECRET")
    redirect_uri = os.getenv("FACEBOOK_REDIRECT_URI", "http://localhost:8000/auth/facebook/callback")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    if not client_id or not client_secret:
        return RedirectResponse(f"{frontend_url}/signin?error=oauth_not_configured")
    
    try:
        # Exchange code for token
        async with httpx.AsyncClient() as client:
            token_resp = await client.get(
                "https://graph.facebook.com/v18.0/oauth/access_token",
                params={
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "redirect_uri": redirect_uri,
                    "code": code
                }
            )
            token_data = token_resp.json()
            access_token = token_data.get("access_token")
            
            # Get user info
            user_resp = await client.get(
                "https://graph.facebook.com/v18.0/me",
                params={
                    "fields": "id,name,email",
                    "access_token": access_token
                }
            )
            fb_user = user_resp.json()
        
        # Find or create user
        engine = get_engine()
        with engine.connect() as conn:
            user = conn.execute(
                text("""
                    SELECT id, email, name, oauth_provider
                    FROM users
                    WHERE oauth_id = :oauth_id AND oauth_provider = 'facebook'
                """),
                {"oauth_id": fb_user["id"]}
            ).mappings().first()
            
            if not user:
                # Check if email exists
                existing_email = conn.execute(
                    text("SELECT id FROM users WHERE email = :email"),
                    {"email": fb_user.get("email", "").lower()}
                ).mappings().first()
                
                if existing_email:
                    conn.execute(
                        text("""
                            UPDATE users
                            SET oauth_provider = 'facebook', oauth_id = :oauth_id
                            WHERE id = :user_id
                        """),
                        {
                            "oauth_id": fb_user["id"],
                            "user_id": existing_email["id"]
                        }
                    )
                    user_id = existing_email["id"]
                else:
                    result = conn.execute(
                        text("""
                            INSERT INTO users (email, name, oauth_provider, oauth_id)
                            VALUES (:email, :name, 'facebook', :oauth_id)
                            RETURNING id, email, name, oauth_provider
                        """),
                        {
                            "email": fb_user.get("email", f"{fb_user['id']}@facebook.com").lower(),
                            "name": fb_user.get("name"),
                            "oauth_id": fb_user["id"]
                        }
                    )
                    user = result.mappings().first()
                    user_id = user["id"]
            else:
                user_id = user["id"]
            
            conn.commit()
        
        # Create tokens
        access_token_jwt = create_access_token(data={"sub": user_id})
        refresh_token = create_refresh_token(data={"sub": user_id})
        save_refresh_token(user_id, refresh_token)
        
        return RedirectResponse(
            f"{frontend_url}/auth/callback?access_token={access_token_jwt}&refresh_token={refresh_token}"
        )
    
    except Exception as e:
        return RedirectResponse(f"{frontend_url}/signin?error=oauth_failed")


# OAuth Routes (Apple)
@router.get("/apple/login")
async def apple_login():
    """Initiate Apple OAuth login."""
    client_id = os.getenv("APPLE_CLIENT_ID")  # Service ID
    redirect_uri = os.getenv("APPLE_REDIRECT_URI", "http://localhost:8000/auth/apple/callback")
    
    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Apple OAuth not configured. Set APPLE_CLIENT_ID in environment variables."
        )
    
    # Apple OAuth URL
    auth_url = (
        f"https://appleid.apple.com/auth/authorize?"
        f"client_id={client_id}&"
        f"redirect_uri={redirect_uri}&"
        f"response_type=code&"
        f"scope=email name&"
        f"response_mode=form_post"
    )
    
    return RedirectResponse(url=auth_url)


@router.post("/apple/callback")
async def apple_callback_post(
    code: Optional[str] = None,
    id_token: Optional[str] = None,
    user: Optional[str] = None
):
    """Handle Apple OAuth callback (POST - form_post mode)."""
    return await apple_callback_handler(code, id_token, user)


@router.get("/apple/callback")
async def apple_callback_get(
    code: Optional[str] = None,
    id_token: Optional[str] = None,
    user: Optional[str] = None
):
    """Handle Apple OAuth callback (GET - fallback)."""
    return await apple_callback_handler(code, id_token, user)


async def apple_callback_handler(
    code: Optional[str] = None,
    id_token: Optional[str] = None,
    user: Optional[str] = None
):
    """Handle Apple OAuth callback."""
    import httpx
    import base64
    import json
    
    client_id = os.getenv("APPLE_CLIENT_ID")
    client_secret = os.getenv("APPLE_CLIENT_SECRET")  # JWT signed with private key
    redirect_uri = os.getenv("APPLE_REDIRECT_URI", "http://localhost:8000/auth/apple/callback")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    if not client_id or not client_secret:
        return RedirectResponse(f"{frontend_url}/signin?error=oauth_not_configured")
    
    apple_user = None
    
    # If we have id_token, decode it to get user info
    if id_token:
        try:
            # Decode JWT (without verification for simplicity - in production, verify signature)
            parts = id_token.split('.')
            if len(parts) == 3:
                # Decode payload (second part)
                payload = parts[1]
                # Add padding if needed
                padding = 4 - len(payload) % 4
                if padding != 4:
                    payload += '=' * padding
                decoded = base64.urlsafe_b64decode(payload)
                apple_user_data = json.loads(decoded)
                
                apple_user = {
                    "id": apple_user_data.get("sub"),
                    "email": apple_user_data.get("email"),
                    "name": None
                }
                
                # Parse user object if provided (first time only)
                if user:
                    try:
                        user_obj = json.loads(user)
                        apple_user["name"] = user_obj.get("name", {}).get("firstName", "") + " " + user_obj.get("name", {}).get("lastName", "")
                        apple_user["name"] = apple_user["name"].strip() or None
                    except:
                        pass
            else:
                raise ValueError("Invalid token format")
        except Exception as e:
            print(f"Error decoding Apple token: {e}")
            return RedirectResponse(f"{frontend_url}/signin?error=oauth_failed")
    elif code:
        # Exchange code for token (if using code flow)
        try:
            async with httpx.AsyncClient() as client:
                token_resp = await client.post(
                    "https://appleid.apple.com/auth/token",
                    data={
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "code": code,
                        "grant_type": "authorization_code",
                        "redirect_uri": redirect_uri
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )
                
                if not token_resp.is_success:
                    return RedirectResponse(f"{frontend_url}/signin?error=oauth_failed")
                
                token_data = token_resp.json()
                id_token = token_data.get("id_token")
                
                if not id_token:
                    return RedirectResponse(f"{frontend_url}/signin?error=oauth_failed")
                
                # Decode id_token
                parts = id_token.split('.')
                if len(parts) == 3:
                    payload = parts[1]
                    padding = 4 - len(payload) % 4
                    if padding != 4:
                        payload += '=' * padding
                    decoded = base64.urlsafe_b64decode(payload)
                    apple_user_data = json.loads(decoded)
                    
                    apple_user = {
                        "id": apple_user_data.get("sub"),
                        "email": apple_user_data.get("email"),
                        "name": None
                    }
                else:
                    return RedirectResponse(f"{frontend_url}/signin?error=oauth_failed")
        except Exception as e:
            print(f"Error exchanging Apple code: {e}")
            return RedirectResponse(f"{frontend_url}/signin?error=oauth_failed")
    else:
        return RedirectResponse(f"{frontend_url}/signin?error=oauth_failed")
    
    if not apple_user or not apple_user.get("id"):
        return RedirectResponse(f"{frontend_url}/signin?error=oauth_failed")
    
    # Find or create user
    engine = get_engine()
    with engine.connect() as conn:
        user = conn.execute(
            text("""
                SELECT id, email, name, oauth_provider
                FROM users
                WHERE oauth_id = :oauth_id AND oauth_provider = 'apple'
            """),
            {"oauth_id": apple_user["id"]}
        ).mappings().first()
        
        if not user:
            # Check if email exists
            existing_email = None
            if apple_user.get("email"):
                existing_email = conn.execute(
                    text("SELECT id FROM users WHERE email = :email"),
                    {"email": apple_user["email"].lower()}
                ).mappings().first()
            
            if existing_email:
                # Link OAuth to existing account
                conn.execute(
                    text("""
                        UPDATE users
                        SET oauth_provider = 'apple', oauth_id = :oauth_id
                        WHERE id = :user_id
                    """),
                    {
                        "oauth_id": apple_user["id"],
                        "user_id": existing_email["id"]
                    }
                )
                user_id = existing_email["id"]
            else:
                # Create new user
                # Apple may not provide email on subsequent logins
                email = apple_user.get("email") or f"{apple_user['id']}@apple.privaterelay.appleid.com"
                result = conn.execute(
                    text("""
                        INSERT INTO users (email, name, oauth_provider, oauth_id)
                        VALUES (:email, :name, 'apple', :oauth_id)
                        RETURNING id, email, name, oauth_provider
                    """),
                    {
                        "email": email.lower(),
                        "name": apple_user.get("name"),
                        "oauth_id": apple_user["id"]
                    }
                )
                user = result.mappings().first()
                user_id = user["id"]
        else:
            user_id = user["id"]
        
        conn.commit()
    
    # Create tokens
    access_token_jwt = create_access_token(data={"sub": user_id})
    refresh_token = create_refresh_token(data={"sub": user_id})
    save_refresh_token(user_id, refresh_token)
    
    return RedirectResponse(
        f"{frontend_url}/auth/callback?access_token={access_token_jwt}&refresh_token={refresh_token}"
    )

