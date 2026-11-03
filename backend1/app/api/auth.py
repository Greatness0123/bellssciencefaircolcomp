from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from jose import jwt, JWTError

from app.database import get_db
from app.models import User, AuditLog
from app.schemas import LoginRequest, Token, UserResponse, UserInvite, UserCreate
from app.core.security import verify_password, create_access_token, get_password_hash, ALGORITHM
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(func.lower(User.email) == email.lower()))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive or pending approval"
        )
    return current_user


def require_admin(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required"
        )
    return current_user


@router.post("/login", response_model=Token)
async def login(credentials: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(func.lower(User.email) == credentials.email.strip().lower())
    )
    user = result.scalars().first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        audit = AuditLog(
            actor_name=credentials.email,
            action="LOGIN_FAILED",
            target_type="AUTH",
            details="Invalid credentials provided"
        )
        db.add(audit)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account status is {user.status}. Contact administrator.",
        )

    user.last_login_at = datetime.now(timezone.utc)
    audit = AuditLog(
        actor_name=user.email,
        action="LOGIN_SUCCESS",
        target_type="AUTH",
        details="User authenticated successfully"
    )
    db.add(audit)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(subject=user.email)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/register", response_model=Token)
async def register(userData: UserCreate, db: AsyncSession = Depends(get_db)):
    clean_email = userData.email.strip().lower()
    existing = await db.execute(select(User).where(func.lower(User.email) == clean_email))
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )

    hashed_pw = get_password_hash(userData.password)
    new_user = User(
        email=clean_email,
        full_name=userData.full_name,
        role=userData.role or "analyst",
        status="active",
        hashed_password=hashed_pw
    )
    db.add(new_user)

    audit = AuditLog(
        actor_name=clean_email,
        action="USER_REGISTERED",
        target_type="USER",
        target_id=clean_email,
        details="New user created account"
    )
    db.add(audit)
    await db.commit()
    await db.refresh(new_user)

    access_token = create_access_token(subject=new_user.email)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user,
    }


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    result = await db.execute(select(User).order_by(User.id.asc()))
    return result.scalars().all()


@router.post("/invite", response_model=UserResponse)
async def invite_user(
    invite_data: UserInvite,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    clean_email = invite_data.email.strip().lower()
    existing = await db.execute(select(User).where(func.lower(User.email) == clean_email))
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )

    temp_hash = get_password_hash("SentinelInitPass2026!")

    new_user = User(
        email=clean_email,
        full_name=invite_data.full_name,
        role=invite_data.role,
        status="active",
        hashed_password=temp_hash
    )
    db.add(new_user)

    audit = AuditLog(
        actor_name=admin.email,
        action="USER_INVITED",
        target_type="USER",
        target_id=clean_email,
        details=f"Invited user with role {invite_data.role}"
    )
    db.add(audit)
    await db.commit()
    await db.refresh(new_user)
    return new_user
