import logging
import os
import uuid
from datetime import date, datetime, timezone
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from starlette.middleware.cors import CORSMiddleware


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ServiceItem(BaseModel):
    id: str
    title: str
    category: str
    description: str
    image_url: str
    cta_text: str


class GalleryItem(BaseModel):
    id: str
    category: str
    title: str
    image_url: str


class ContactInfo(BaseModel):
    shop_name: str
    phone: str
    email: str
    hours: str
    address: str
    map_embed_url: str
    whatsapp_number: str


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
    service_type: str
    appointment_date: date
    notes: Optional[str] = ""


class Appointment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    service_type: str
    appointment_date: date
    notes: str
    status: str = "booked"
    created_at: datetime = Field(default_factory=utc_now)


SERVICES: List[ServiceItem] = [
    ServiceItem(
        id="srv-men-suits",
        title="Men's Suits",
        category="men",
        description="Custom-tailored suits with premium construction for a sharp, confident look.",
        image_url="https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=900&q=80",
        cta_text="View Designs",
    ),
    ServiceItem(
        id="srv-women-dresses",
        title="Women's Dresses",
        category="women",
        description="Stylish and elegant dresses tailored to your fit, comfort, and personal style.",
        image_url="https://images.pexels.com/photos/1462637/pexels-photo-1462637.jpeg?auto=compress&cs=tinysrgb&w=900",
        cta_text="View Designs",
    ),
    ServiceItem(
        id="srv-bridal",
        title="Bridal Wear",
        category="bridal",
        description="Handcrafted bridal gowns and occasion wear finished with meticulous detailing.",
        image_url="https://images.pexels.com/photos/7717488/pexels-photo-7717488.jpeg?auto=compress&cs=tinysrgb&w=900",
        cta_text="View Designs",
    ),
    ServiceItem(
        id="srv-alterations",
        title="Alterations",
        category="alterations",
        description="Precise alterations and repairs to refresh your garments with a perfect fit.",
        image_url="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80",
        cta_text="View Designs",
    ),
]


GALLERY: List[GalleryItem] = [
    GalleryItem(
        id="gal-men-1",
        category="men",
        title="Classic Navy Three-Piece",
        image_url="https://images.unsplash.com/photo-1593032465171-8bdc3f6f88f0?auto=format&fit=crop&w=900&q=80",
    ),
    GalleryItem(
        id="gal-men-2",
        category="men",
        title="Modern Formal Suit",
        image_url="https://images.unsplash.com/photo-1610652492500-ded49ceeb378?auto=format&fit=crop&w=900&q=80",
    ),
    GalleryItem(
        id="gal-women-1",
        category="women",
        title="Evening Dress",
        image_url="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
    ),
    GalleryItem(
        id="gal-bridal-1",
        category="bridal",
        title="Bridal Gown",
        image_url="https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=900",
    ),
    GalleryItem(
        id="gal-bridal-2",
        category="bridal",
        title="Back Detail Embroidery",
        image_url="https://images.pexels.com/photos/265722/pexels-photo-265722.jpeg?auto=compress&cs=tinysrgb&w=900",
    ),
    GalleryItem(
        id="gal-women-2",
        category="women",
        title="Contemporary Festive Wear",
        image_url="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
    ),
]


CONTACT = ContactInfo(
    shop_name="Tour Tailor",
    phone="+123 456 7890",
    email="info@yourtailor.com",
    hours="Mon - Sat: 10:00 AM - 7:00 PM",
    address="214 Heritage Street, Fashion District",
    map_embed_url="https://www.google.com/maps?q=Savile+Row+London&output=embed",
    whatsapp_number="1234567890",
)

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Tour Tailor API is running"}


@api_router.get("/content/services", response_model=List[ServiceItem])
async def get_services():
    return SERVICES


@api_router.get("/content/gallery", response_model=List[GalleryItem])
async def get_gallery(category: str = "all"):
    selected = category.lower()
    if selected == "all":
        return GALLERY
    return [item for item in GALLERY if item.category == selected]


@api_router.get("/content/contact", response_model=ContactInfo)
async def get_contact_info():
    return CONTACT


@api_router.post("/design-requests", response_model=DesignRequest)
async def create_design_request(input_data: DesignRequestCreate):
    design_request = DesignRequest(**input_data.model_dump())
    doc = design_request.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()

    await db.design_requests.insert_one(doc)
    return design_request


@api_router.get("/design-requests", response_model=List[DesignRequest])
async def list_design_requests():
    docs = await db.design_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    output: List[DesignRequest] = []
    for doc in docs:
        created_at = doc.get("created_at")
        normalized_created_at = (
            datetime.fromisoformat(created_at) if isinstance(created_at, str) else created_at
        )
        output.append(
            DesignRequest(
                id=doc.get("id", str(uuid.uuid4())),
                name=doc.get("name", ""),
                phone=doc.get("phone", ""),
                message=doc.get("message", ""),
                image_name=doc.get("image_name", ""),
                style_category=doc.get("style_category", ""),
                status=doc.get("status", "new"),
                created_at=normalized_created_at,
            )
        )
    return output


@api_router.post("/appointments", response_model=Appointment)
async def create_appointment(input_data: AppointmentCreate):
    appointment = Appointment(**input_data.model_dump())
    doc = appointment.model_dump()
    doc["appointment_date"] = doc["appointment_date"].isoformat()
    doc["created_at"] = doc["created_at"].isoformat()

    await db.appointments.insert_one(doc)
    return appointment


@api_router.get("/appointments", response_model=List[Appointment])
async def list_appointments():
    docs = await db.appointments.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    output: List[Appointment] = []
    for doc in docs:
        created_at = doc.get("created_at")
        appointment_date = doc.get("appointment_date")
        normalized_created_at = (
            datetime.fromisoformat(created_at) if isinstance(created_at, str) else created_at
        )
        normalized_appointment_date = (
            date.fromisoformat(appointment_date)
            if isinstance(appointment_date, str)
            else appointment_date
        )
        output.append(
            Appointment(
                id=doc.get("id", str(uuid.uuid4())),
                name=doc.get("name", ""),
                phone=doc.get("phone", ""),
                service_type=doc.get("service_type", ""),
                appointment_date=normalized_appointment_date,
                notes=doc.get("notes", ""),
                status=doc.get("status", "booked"),
                created_at=normalized_created_at,
            )
        )
    return output

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ["CORS_ORIGINS"].split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()