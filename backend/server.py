import logging
import os
import secrets
import uuid
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Optional

import jwt
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, Header, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_SECRET = f"{os.environ['DB_NAME']}_tailor_admin_secret"
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 12 * 60
RESET_CODE_TTL_MINUTES = 15

PASSWORD_CONTEXT = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALLOWED_STATUS = ["pending", "confirmed", "rejected", "completed", "cancelled"]
PLACEHOLDER_IMAGE = (
    "https://images.unsplash.com/photo-1628565663674-de1c8161d72c?auto=format&fit=crop&w=900&q=80"
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def to_iso(dt: datetime) -> str:
    return dt.isoformat()


def parse_iso_datetime(value: object) -> datetime:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        return datetime.fromisoformat(value)
    return utc_now()


def parse_iso_date(value: object) -> date:
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        return date.fromisoformat(value)
    return date.today()


def hash_password(password: str) -> str:
    return PASSWORD_CONTEXT.hash(password)


def verify_password(raw_password: str, password_hash: str) -> bool:
    return PASSWORD_CONTEXT.verify(raw_password, password_hash)


def create_token(admin_id: str, email: str) -> str:
    payload = {
        "sub": admin_id,
        "email": email,
        "role": "admin",
        "exp": utc_now() + timedelta(minutes=JWT_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def read_bearer_token(authorization: Optional[str]) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
        )
    return authorization.split(" ", 1)[1].strip()


async def get_current_admin(authorization: Optional[str]) -> Dict[str, str]:
    token = read_bearer_token(authorization)
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc

    if payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    admin = await db.admin_users.find_one({"id": payload.get("sub")}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin not found")
    return admin


class ContactInfo(BaseModel):
    shop_name: str
    phone: str
    email: str
    hours: str
    address: str
    map_embed_url: str
    whatsapp_number: str


class PublicDesign(BaseModel):
    id: str
    title: str
    category: str
    description: str
    image_url: str
    price_note: str


class ServiceItem(BaseModel):
    id: str
    title: str
    category: str
    description: str
    image_url: str
    cta_text: str = "View Designs"


class GalleryItem(BaseModel):
    id: str
    category: str
    title: str
    image_url: str


class DesignRequestCreate(BaseModel):
    name: str
    phone: str
    message: str
    image_name: Optional[str] = ""
    style_category: Optional[str] = ""


class DesignRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    message: str
    image_name: str
    style_category: str
    status: str = "new"
    created_at: datetime = Field(default_factory=utc_now)


class AppointmentCreate(BaseModel):
    name: str
    phone: str
    appointment_date: date
    notes: Optional[str] = ""
    design_id: Optional[str] = ""
    design_title: Optional[str] = ""


class Appointment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    appointment_date: date
    notes: str
    design_id: str
    design_title: str
    status: str = "pending"
    created_at: datetime = Field(default_factory=utc_now)


class OrderCreate(BaseModel):
    name: str
    phone: str
    design_id: str
    design_title: str
    quantity: int = 1
    message: Optional[str] = ""


class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    design_id: str
    design_title: str
    quantity: int = 1
    message: str
    status: str = "pending"
    created_at: datetime = Field(default_factory=utc_now)


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminAuthResponse(BaseModel):
    token: str
    admin_name: str
    admin_email: EmailStr


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    message: str
    reset_code: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    reset_code: str
    new_password: str


class AdminProfile(BaseModel):
    id: str
    name: str
    email: EmailStr


class AdminDesignCreate(BaseModel):
    title: str
    category: str
    description: str
    image_url: Optional[str] = ""
    image_data_url: Optional[str] = ""
    price_note: Optional[str] = ""
    is_active: bool = True


class AdminDesignUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    image_data_url: Optional[str] = None
    price_note: Optional[str] = None
    is_active: Optional[bool] = None


class AdminDesign(BaseModel):
    id: str
    title: str
    category: str
    description: str
    image_url: str
    price_note: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class StatusUpdateRequest(BaseModel):
    status: str


class AdminStats(BaseModel):
    today_bookings: int
    pending_appointments: int
    pending_orders: int
    total_designs: int
    total_appointments: int
    total_orders: int


CONTACT = ContactInfo(
    shop_name="Tour Tailor",
    phone="+123 456 7890",
    email="info@yourtailor.com",
    hours="Mon - Sat: 10:00 AM - 7:00 PM",
    address="214 Heritage Street, Fashion District",
    map_embed_url="https://www.google.com/maps?q=Savile+Row+London&output=embed",
    whatsapp_number="1234567890",
)


DEFAULT_DESIGNS = [
    {
        "id": "design-men-suit",
        "title": "Men's Suits",
        "category": "men",
        "description": "Custom-tailored suits with premium construction and impeccable finishing.",
        "image_url": "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=900&q=80",
        "price_note": "Starting from $299",
        "is_active": True,
    },
    {
        "id": "design-women-dress",
        "title": "Women's Dresses",
        "category": "women",
        "description": "Elegant dresses tailored to your body line, occasion, and comfort.",
        "image_url": "https://images.pexels.com/photos/1462637/pexels-photo-1462637.jpeg?auto=compress&cs=tinysrgb&w=900",
        "price_note": "Starting from $179",
        "is_active": True,
    },
    {
        "id": "design-bridal",
        "title": "Bridal Wear",
        "category": "bridal",
        "description": "Handcrafted bridal ensembles with couture-level detailing.",
        "image_url": "https://images.pexels.com/photos/7717488/pexels-photo-7717488.jpeg?auto=compress&cs=tinysrgb&w=900",
        "price_note": "Starting from $799",
        "is_active": True,
    },
    {
        "id": "design-alterations",
        "title": "Alterations",
        "category": "alterations",
        "description": "Professional alterations to transform fit and revive your favorites.",
        "image_url": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80",
        "price_note": "From $25 per piece",
        "is_active": True,
    },
]


def normalize_design_document(doc: Dict[str, object]) -> AdminDesign:
    return AdminDesign(
        id=str(doc.get("id", str(uuid.uuid4()))),
        title=str(doc.get("title", "")),
        category=str(doc.get("category", "general")),
        description=str(doc.get("description", "")),
        image_url=str(doc.get("image_url", PLACEHOLDER_IMAGE)),
        price_note=str(doc.get("price_note", "")),
        is_active=bool(doc.get("is_active", True)),
        created_at=parse_iso_datetime(doc.get("created_at")),
        updated_at=parse_iso_datetime(doc.get("updated_at")),
    )


def normalize_appointment_document(doc: Dict[str, object]) -> Appointment:
    raw_status = str(doc.get("status", "pending")).lower().strip()
    normalized_status = "confirmed" if raw_status == "booked" else raw_status
    return Appointment(
        id=str(doc.get("id", str(uuid.uuid4()))),
        name=str(doc.get("name", "")),
        phone=str(doc.get("phone", "")),
        appointment_date=parse_iso_date(doc.get("appointment_date")),
        notes=str(doc.get("notes", "")),
        design_id=str(doc.get("design_id", "")),
        design_title=str(doc.get("design_title", "")),
        status=normalized_status,
        created_at=parse_iso_datetime(doc.get("created_at")),
    )


def normalize_order_document(doc: Dict[str, object]) -> Order:
    return Order(
        id=str(doc.get("id", str(uuid.uuid4()))),
        name=str(doc.get("name", "")),
        phone=str(doc.get("phone", "")),
        design_id=str(doc.get("design_id", "")),
        design_title=str(doc.get("design_title", "")),
        quantity=int(doc.get("quantity", 1)),
        message=str(doc.get("message", "")),
        status=str(doc.get("status", "pending")),
        created_at=parse_iso_datetime(doc.get("created_at")),
    )


async def ensure_default_admin() -> None:
    count = await db.admin_users.count_documents({})
    if count > 0:
        return
    now = to_iso(utc_now())
    default_admin = {
        "id": str(uuid.uuid4()),
        "name": "Primary Admin",
        "email": "admin@tourtailor.com",
        "password_hash": hash_password("Admin@12345"),
        "reset_code": "",
        "reset_code_expires_at": "",
        "created_at": now,
        "updated_at": now,
    }
    await db.admin_users.insert_one(default_admin)


async def ensure_default_designs() -> None:
    count = await db.designs.count_documents({})
    if count > 0:
        return
    now = to_iso(utc_now())
    docs = []
    for item in DEFAULT_DESIGNS:
        docs.append(
            {
                **item,
                "created_at": now,
                "updated_at": now,
            }
        )
    await db.designs.insert_many(docs)


@app.on_event("startup")
async def startup_tasks() -> None:
    await ensure_default_admin()
    await ensure_default_designs()


@api_router.get("/")
async def root():
    return {"message": "Tour Tailor API is running"}


@api_router.get("/content/contact", response_model=ContactInfo)
async def get_contact_info():
    return CONTACT


@api_router.get("/content/designs", response_model=List[PublicDesign])
async def get_public_designs(category: str = "all"):
    query: Dict[str, object] = {"is_active": True}
    selected = category.lower().strip()
    if selected and selected != "all":
        query["category"] = selected
    docs = await db.designs.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return [
        PublicDesign(
            id=str(doc.get("id", "")),
            title=str(doc.get("title", "")),
            category=str(doc.get("category", "general")),
            description=str(doc.get("description", "")),
            image_url=str(doc.get("image_url", PLACEHOLDER_IMAGE)),
            price_note=str(doc.get("price_note", "")),
        )
        for doc in docs
    ]


@api_router.get("/content/services", response_model=List[ServiceItem])
async def get_services():
    designs = await get_public_designs("all")
    return [
        ServiceItem(
            id=item.id,
            title=item.title,
            category=item.category,
            description=item.description,
            image_url=item.image_url,
            cta_text="View Designs",
        )
        for item in designs
    ]


@api_router.get("/content/gallery", response_model=List[GalleryItem])
async def get_gallery(category: str = "all"):
    designs = await get_public_designs(category)
    return [
        GalleryItem(
            id=item.id,
            category=item.category,
            title=item.title,
            image_url=item.image_url,
        )
        for item in designs
    ]


@api_router.post("/design-requests", response_model=DesignRequest)
async def create_design_request(input_data: DesignRequestCreate):
    design_request = DesignRequest(**input_data.model_dump())
    doc = design_request.model_dump()
    doc["created_at"] = to_iso(design_request.created_at)
    await db.design_requests.insert_one(doc)
    return design_request


@api_router.get("/design-requests", response_model=List[DesignRequest])
async def list_design_requests():
    docs = await db.design_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [
        DesignRequest(
            id=str(doc.get("id", str(uuid.uuid4()))),
            name=str(doc.get("name", "")),
            phone=str(doc.get("phone", "")),
            message=str(doc.get("message", "")),
            image_name=str(doc.get("image_name", "")),
            style_category=str(doc.get("style_category", "")),
            status=str(doc.get("status", "new")),
            created_at=parse_iso_datetime(doc.get("created_at")),
        )
        for doc in docs
    ]


@api_router.post("/appointments", response_model=Appointment)
async def create_appointment(input_data: AppointmentCreate):
    appointment = Appointment(**input_data.model_dump())
    doc = appointment.model_dump()
    doc["appointment_date"] = appointment.appointment_date.isoformat()
    doc["created_at"] = to_iso(appointment.created_at)
    await db.appointments.insert_one(doc)
    return appointment


@api_router.get("/appointments", response_model=List[Appointment])
async def list_appointments():
    docs = await db.appointments.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [normalize_appointment_document(doc) for doc in docs]


@api_router.post("/orders", response_model=Order)
async def create_order(input_data: OrderCreate):
    order = Order(**input_data.model_dump())
    doc = order.model_dump()
    doc["created_at"] = to_iso(order.created_at)
    await db.orders.insert_one(doc)
    return order


@api_router.post("/admin/auth/login", response_model=AdminAuthResponse)
async def admin_login(payload: AdminLoginRequest):
    admin = await db.admin_users.find_one({"email": payload.email.lower().strip()}, {"_id": 0})
    if not admin or not verify_password(payload.password, str(admin.get("password_hash", ""))):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_token(str(admin["id"]), str(admin["email"]))
    return AdminAuthResponse(
        token=token,
        admin_name=str(admin.get("name", "Admin")),
        admin_email=admin.get("email", "admin@tourtailor.com"),
    )


@api_router.post("/admin/auth/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(payload: ForgotPasswordRequest):
    admin = await db.admin_users.find_one({"email": payload.email.lower().strip()}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin account not found")
    code = "".join(secrets.choice("0123456789") for _ in range(6))
    expires_at = to_iso(utc_now() + timedelta(minutes=RESET_CODE_TTL_MINUTES))
    await db.admin_users.update_one(
        {"id": admin["id"]},
        {"$set": {"reset_code": code, "reset_code_expires_at": expires_at, "updated_at": to_iso(utc_now())}},
    )
    return ForgotPasswordResponse(
        message="Reset code generated. Use it on reset password screen.",
        reset_code=code,
    )


@api_router.post("/admin/auth/reset-password")
async def reset_password(payload: ResetPasswordRequest):
    admin = await db.admin_users.find_one({"email": payload.email.lower().strip()}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin account not found")

    reset_code = str(admin.get("reset_code", ""))
    expires_raw = admin.get("reset_code_expires_at", "")
    if reset_code != payload.reset_code.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reset code")

    expires_at = parse_iso_datetime(expires_raw)
    if utc_now() > expires_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset code has expired")

    await db.admin_users.update_one(
        {"id": admin["id"]},
        {
            "$set": {
                "password_hash": hash_password(payload.new_password),
                "reset_code": "",
                "reset_code_expires_at": "",
                "updated_at": to_iso(utc_now()),
            }
        },
    )
    return {"message": "Password updated successfully"}


@api_router.get("/admin/me", response_model=AdminProfile)
async def admin_me(authorization: Optional[str] = Header(default=None)):
    admin = await get_current_admin(authorization)
    return AdminProfile(id=admin["id"], name=admin.get("name", "Admin"), email=admin["email"])


@api_router.get("/admin/stats", response_model=AdminStats)
async def admin_stats(authorization: Optional[str] = Header(default=None)):
    _ = await get_current_admin(authorization)
    today = date.today().isoformat()
    today_bookings = await db.appointments.count_documents({"appointment_date": today})
    pending_appointments = await db.appointments.count_documents({"status": "pending"})
    pending_orders = await db.orders.count_documents({"status": "pending"})
    total_designs = await db.designs.count_documents({})
    total_appointments = await db.appointments.count_documents({})
    total_orders = await db.orders.count_documents({})

    return AdminStats(
        today_bookings=today_bookings,
        pending_appointments=pending_appointments,
        pending_orders=pending_orders,
        total_designs=total_designs,
        total_appointments=total_appointments,
        total_orders=total_orders,
    )


@api_router.get("/admin/designs", response_model=List[AdminDesign])
async def admin_list_designs(authorization: Optional[str] = Header(default=None)):
    _ = await get_current_admin(authorization)
    docs = await db.designs.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [normalize_design_document(doc) for doc in docs]


@api_router.post("/admin/designs", response_model=AdminDesign)
async def admin_create_design(payload: AdminDesignCreate, authorization: Optional[str] = Header(default=None)):
    _ = await get_current_admin(authorization)
    now = utc_now()
    resolved_image = payload.image_data_url or payload.image_url or PLACEHOLDER_IMAGE
    design_doc = {
        "id": str(uuid.uuid4()),
        "title": payload.title,
        "category": payload.category.lower().strip() or "general",
        "description": payload.description,
        "image_url": resolved_image,
        "price_note": payload.price_note or "",
        "is_active": payload.is_active,
        "created_at": to_iso(now),
        "updated_at": to_iso(now),
    }
    await db.designs.insert_one(design_doc)
    return normalize_design_document(design_doc)


@api_router.put("/admin/designs/{design_id}", response_model=AdminDesign)
async def admin_update_design(
    design_id: str,
    payload: AdminDesignUpdate,
    authorization: Optional[str] = Header(default=None),
):
    _ = await get_current_admin(authorization)
    existing = await db.designs.find_one({"id": design_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Design not found")

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if "image_data_url" in updates and updates["image_data_url"]:
        updates["image_url"] = updates["image_data_url"]
    updates.pop("image_data_url", None)
    updates["updated_at"] = to_iso(utc_now())

    await db.designs.update_one({"id": design_id}, {"$set": updates})
    merged = {**existing, **updates}
    return normalize_design_document(merged)


@api_router.delete("/admin/designs/{design_id}")
async def admin_delete_design(design_id: str, authorization: Optional[str] = Header(default=None)):
    _ = await get_current_admin(authorization)
    result = await db.designs.delete_one({"id": design_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Design not found")
    return {"message": "Design deleted"}


@api_router.get("/admin/appointments", response_model=List[Appointment])
async def admin_list_appointments(authorization: Optional[str] = Header(default=None)):
    _ = await get_current_admin(authorization)
    docs = await db.appointments.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [normalize_appointment_document(doc) for doc in docs]


@api_router.patch("/admin/appointments/{appointment_id}/status", response_model=Appointment)
async def admin_update_appointment_status(
    appointment_id: str,
    payload: StatusUpdateRequest,
    authorization: Optional[str] = Header(default=None),
):
    _ = await get_current_admin(authorization)
    incoming_status = payload.status.lower().strip()
    if incoming_status not in ALLOWED_STATUS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")

    existing = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    await db.appointments.update_one(
        {"id": appointment_id},
        {"$set": {"status": incoming_status, "updated_at": to_iso(utc_now())}},
    )
    merged = {**existing, "status": incoming_status}
    return normalize_appointment_document(merged)


@api_router.get("/admin/orders", response_model=List[Order])
async def admin_list_orders(authorization: Optional[str] = Header(default=None)):
    _ = await get_current_admin(authorization)
    docs = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [normalize_order_document(doc) for doc in docs]


@api_router.patch("/admin/orders/{order_id}/status", response_model=Order)
async def admin_update_order_status(
    order_id: str,
    payload: StatusUpdateRequest,
    authorization: Optional[str] = Header(default=None),
):
    _ = await get_current_admin(authorization)
    incoming_status = payload.status.lower().strip()
    if incoming_status not in ALLOWED_STATUS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")

    existing = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": incoming_status, "updated_at": to_iso(utc_now())}},
    )
    merged = {**existing, "status": incoming_status}
    return normalize_order_document(merged)


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ["CORS_ORIGINS"].split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()