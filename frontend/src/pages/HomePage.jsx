"use client";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Scissors,
  ShoppingBag,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1628565663674-de1c8161d72c?auto=format&fit=crop&w=900&q=80";

const fallbackContact = {
  shop_name: "Tour Tailor",
  phone: "+123 456 7890",
  email: "info@yourtailor.com",
  hours: "Mon - Sat: 10:00 AM - 7:00 PM",
  address: "214 Heritage Street, Fashion District",
  map_embed_url: "https://www.google.com/maps?q=Savile+Row+London&output=embed",
  whatsapp_number: "1234567890",
};

const galleryTabs = [
  { value: "all", label: "All" },
  { value: "men", label: "Men's" },
  { value: "women", label: "Women's" },
  { value: "bridal", label: "Bridal" },
  { value: "alterations", label: "Alterations" },
];
export default function HomePage() {
  const [designs, setDesigns] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [contact, setContact] = useState(fallbackContact);
  const [activeCategory, setActiveCategory] = useState("all");
  const [sliderValue, setSliderValue] = useState(50);
  const [selectedDesignId, setSelectedDesignId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [designForm, setDesignForm] = useState({
    name: "",
    phone: "",
    style_category: "",
    message: "",
  });

  const [appointmentForm, setAppointmentForm] = useState({
    name: "",
    phone: "",
    appointment_date: "",
    notes: "",
    design_id: "",
    design_title: "",
  });

  const [orderForm, setOrderForm] = useState({
    name: "",
    phone: "",
    quantity: 1,
    message: "",
    design_id: "",
    design_title: "",
  });

const [isOpen, setIsOpen] = useState(false);

  // Helper to close menu when a link is clicked
  const closeMenu = () => setIsOpen(false);
  

  useEffect(() => {
    const loadPageData = async () => {
      try {
        const [designsRes, galleryRes, contactRes] = await Promise.all([
          api.get("/content/designs"),
          api.get("/content/gallery"),
          api.get("/content/contact"),
        ]);
        setDesigns(designsRes.data || []);
        setGallery(galleryRes.data || []);
        setContact(contactRes.data || fallbackContact);
      } catch (error) {
        toast.error("Could not load latest catalog. Showing available data.");
      }
    };
    loadPageData();
  }, []);

  const filteredGallery =
    activeCategory === "all"
      ? gallery
      : gallery.filter(
          (item) =>
            String(item.category || "").toLowerCase() === activeCategory,
        );

  const whatsappLink = useMemo(() => {
    const text = encodeURIComponent("Hi, I want to place a tailoring order.");
    return `https://wa.me/${contact.whatsapp_number}?text=${text}`;
  }, [contact.whatsapp_number]);

  const selectDesign = (design, targetId) => {
    setSelectedDesignId(design.id);
    setAppointmentForm((prev) => ({
      ...prev,
      design_id: design.id,
      design_title: design.title,
    }));
    setOrderForm((prev) => ({
      ...prev,
      design_id: design.id,
      design_title: design.title,
    }));
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const onImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = FALLBACK_IMAGE;
  };

  const submitUserDesignRequest = async (event) => {
    event.preventDefault();
    try {
      await api.post("/design-requests", {
        ...designForm,
        image_name: selectedFile?.name || "",
      });
      setDesignForm({ name: "", phone: "", style_category: "", message: "" });
      setSelectedFile(null);
      toast.success("Design request submitted successfully.");
    } catch (error) {
      toast.error("Unable to submit your design request.");
    }
  };

  const submitAppointment = async (event) => {
    event.preventDefault();
    try {
      await api.post("/appointments", {
        ...appointmentForm,
        design_id: appointmentForm.design_id || selectedDesignId,
        design_title:
          appointmentForm.design_title ||
          designs.find((item) => item.id === selectedDesignId)?.title ||
          "",
      });
      setAppointmentForm({
        name: "",
        phone: "",
        appointment_date: "",
        notes: "",
        design_id: "",
        design_title: "",
      });
      toast.success("Appointment request submitted.");
    } catch (error) {
      toast.error("Could not create appointment.");
    }
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    try {
      await api.post("/orders", {
        ...orderForm,
        design_id: orderForm.design_id || selectedDesignId,
        design_title:
          orderForm.design_title ||
          designs.find((item) => item.id === selectedDesignId)?.title ||
          "",
      });
      setOrderForm({
        name: "",
        phone: "",
        quantity: 1,
        message: "",
        design_id: "",
        design_title: "",
      });
      toast.success("Order placed successfully.");
    } catch (error) {
      toast.error("Could not place order.");
    }
  };

  return (
    <div className="tailor-app" data-testid="user-home-page">
      <header
        className="fixed top-0 left-0 w-full bg-white shadow-md z-50"
        data-testid="user-top-navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Brand */}
            <a
              className="text-2xl font-bold text-gold-600 tracking-tight"
              href="#home"
              data-testid="user-brand-link"
            >
              Tour Tailor
            </a>

            {/* Desktop Links */}
            <nav
              className="hidden md:flex space-x-8 items-center"
              data-testid="user-nav-links-wrap"
            >
              <a
                href="#home"
                className="text-gray-700 hover:text-gold-500 transition"
              >
                Home
              </a>
              <a
                href="#designs"
                className="text-gray-700 hover:text-gold-500 transition"
              >
                Designs
              </a>
              <a
                href="#gallery"
                className="text-gray-700 hover:text-gold-500 transition"
              >
                Gallery
              </a>
              <a
                href="#book"
                className="text-gray-700 hover:text-gold-500 transition"
              >
                Book
              </a>
              <a
                href="#contact"
                className="text-gray-700 hover:text-gold-500 transition"
              >
                Contact
              </a>
              <a
                href="/admin/login"
                className="text-sm text-gray-400 hover:underline"
              >
                Admin
              </a>

              <a
                href="#book"
                className="ml-4 px-5 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition"
              >
                Book Appointment
              </a>
            </nav>

            {/* Mobile Hamburger Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-gray-700 outline-none p-2"
                aria-label="Toggle menu"
              >
                <div className="relative w-6 h-5">
                  <span
                    className={`absolute block h-0.5 w-6 bg-current transform transition duration-300 ease-in-out ${isOpen ? "rotate-45 translate-y-2" : ""}`}
                  ></span>
                  <span
                    className={`absolute block h-0.5 w-6 bg-current transform transition duration-300 ease-in-out top-2 ${isOpen ? "opacity-0" : "opacity-100"}`}
                  ></span>
                  <span
                    className={`absolute block h-0.5 w-6 bg-current transform transition duration-300 ease-in-out top-4 ${isOpen ? "-rotate-45 -translate-y-2" : ""}`}
                  ></span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"}`}
        >
          <div className="px-4 pt-2 pb-6 space-y-1 bg-gray-50 border-t border-gray-100">
            <a
              href="#home"
              onClick={closeMenu}
              className="block px-3 py-4 text-base font-medium text-gray-700 hover:bg-gray-100"
            >
              Home
            </a>
            <a
              href="#designs"
              onClick={closeMenu}
              className="block px-3 py-4 text-base font-medium text-gray-700 hover:bg-gray-100"
            >
              Designs
            </a>
            <a
              href="#gallery"
              onClick={closeMenu}
              className="block px-3 py-4 text-base font-medium text-gray-700 hover:bg-gray-100"
            >
              Gallery
            </a>
            <a
              href="#book"
              onClick={closeMenu}
              className="block px-3 py-4 text-base font-medium text-gray-700 hover:bg-gray-100"
            >
              Book
            </a>
            <a
              href="#contact"
              onClick={closeMenu}
              className="block px-3 py-4 text-base font-medium text-gray-700 hover:bg-gray-100"
            >
              Contact
            </a>
            <div className="pt-4">
              <a
                href="#book"
                onClick={closeMenu}
                className="block w-full text-center px-5 py-3 bg-yellow-600 text-white rounded-md font-bold"
              >
                Book Appointment
              </a>
            </div>
          </div>
        </div>
      </header>

      <main data-testid="user-main-content">
        <section
          className="hero-section"
          id="home"
          data-testid="user-hero-section"
        >
          <img
            src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1800&q=80"
            alt="Master tailor"
            className="hero-image"
            data-testid="user-hero-image"
          />
          <div className="hero-overlay" />
          <div
            className="content-wrap hero-content fade-up"
            data-testid="user-hero-content"
          >
            <p className="hero-tag" data-testid="user-hero-tag">
              Bespoke Tailoring Studio
            </p>
            <h1 className="hero-title" data-testid="user-hero-title">
              Perfect Stitch. Perfect Fit.
            </h1>
            <p className="hero-subtitle" data-testid="user-hero-description">
              Explore premium designs uploaded by our studio, then book your
              appointment or place your order instantly.
            </p>
            <div className="hero-actions" data-testid="user-hero-actions">
              <a href="#book" data-testid="user-hero-book-link">
                <Button
                  className="gold-btn"
                  data-testid="user-hero-book-button"
                >
                  Book Appointment
                </Button>
              </a>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                data-testid="user-hero-whatsapp-link"
              >
                <Button
                  className="whatsapp-btn"
                  data-testid="user-hero-whatsapp-button"
                >
                  WhatsApp Order
                </Button>
              </a>
            </div>
          </div>
        </section>

        <section className="light-section" data-testid="user-about-section">
          <div className="content-wrap about-grid fade-up">
            <div className="media-frame" data-testid="user-about-image-frame">
              <img
                src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=80"
                alt="Tailor studio"
                className="section-image"
                data-testid="user-about-image"
              />
            </div>
            <div data-testid="user-about-copy-wrap">
              <h2 className="section-title" data-testid="user-about-title">
                About Us
              </h2>
              <p
                className="section-description"
                data-testid="user-about-description"
              >
                We blend traditional craftsmanship with modern silhouettes.
                Every garment is measured with precision and stitched to elevate
                comfort, confidence, and style.
              </p>
            </div>
          </div>
        </section>

        <section
          className="dark-section"
          id="designs"
          data-testid="user-designs-section"
        >
          <div className="content-wrap fade-up">
            <h2
              className="section-title section-title-invert"
              data-testid="user-designs-title"
            >
              Designs
            </h2>
            <div className="services-grid" data-testid="user-designs-grid">
              {designs.map((design) => (
                <Card
                  className="service-card"
                  key={design.id}
                  data-testid={`user-design-card-${design.id}`}
                >
                  <img
                    src={design.image_url}
                    alt={design.title}
                    className="service-image"
                    onError={onImageError}
                    data-testid={`user-design-image-${design.id}`}
                  />
                  <CardContent className="service-content">
                    <h3
                      className="service-title"
                      data-testid={`user-design-title-${design.id}`}
                    >
                      {design.title}
                    </h3>
                    <p
                      className="service-description"
                      data-testid={`user-design-description-${design.id}`}
                    >
                      {design.description}
                    </p>
                    <p
                      className="price-note"
                      data-testid={`user-design-price-${design.id}`}
                    >
                      {design.price_note}
                    </p>
                    <div
                      className="dual-actions"
                      data-testid={`user-design-actions-${design.id}`}
                    >
                      <Button
                        className="outline-gold-btn"
                        data-testid={`user-design-book-button-${design.id}`}
                        onClick={() => selectDesign(design, "book")}
                      >
                        Book Appointment
                      </Button>
                      <Button
                        className="gold-btn"
                        data-testid={`user-design-order-button-${design.id}`}
                        onClick={() => selectDesign(design, "order")}
                      >
                        Place Order
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section
          className="dark-section"
          id="gallery"
          data-testid="user-gallery-section"
        >
          <div className="content-wrap fade-up">
            <h2
              className="section-title section-title-invert"
              data-testid="user-gallery-title"
            >
              Gallery
            </h2>
            <div
              className="gallery-tabs-list"
              data-testid="user-gallery-tabs-list"
            >
              {galleryTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  className={`gallery-tab-trigger ${activeCategory === tab.value ? "active-gallery-tab" : ""}`}
                  onClick={() => setActiveCategory(tab.value)}
                  data-testid={`user-gallery-tab-${tab.value}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="gallery-grid" data-testid="user-gallery-grid">
              {filteredGallery.map((item) => (
                <article
                  className="gallery-item"
                  key={item.id}
                  data-testid={`user-gallery-item-${item.id}`}
                >
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="gallery-image"
                    onError={onImageError}
                    data-testid={`user-gallery-image-${item.id}`}
                  />
                  <p
                    className="gallery-caption"
                    data-testid={`user-gallery-caption-${item.id}`}
                  >
                    {item.title}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="light-section"
          data-testid="user-upload-before-after-section"
        >
          <div className="content-wrap dual-grid fade-up">
            <div className="form-panel" data-testid="user-upload-design-panel">
              <h2
                className="section-title"
                data-testid="user-upload-design-title"
              >
                Upload Your Design
              </h2>
              <form
                className="stack-form"
                onSubmit={submitUserDesignRequest}
                data-testid="user-upload-design-form"
              >
                <Input
                  placeholder="Your Name"
                  value={designForm.name}
                  onChange={(event) =>
                    setDesignForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  data-testid="user-upload-name-input"
                  required
                />
                <Input
                  placeholder="Phone Number"
                  value={designForm.phone}
                  onChange={(event) =>
                    setDesignForm((prev) => ({
                      ...prev,
                      phone: event.target.value,
                    }))
                  }
                  data-testid="user-upload-phone-input"
                  required
                />
                <Input
                  placeholder="Category"
                  value={designForm.style_category}
                  onChange={(event) =>
                    setDesignForm((prev) => ({
                      ...prev,
                      style_category: event.target.value,
                    }))
                  }
                  data-testid="user-upload-category-input"
                />
                <label
                  className="file-label"
                  data-testid="user-upload-file-label"
                >
                  <Upload size={16} />
                  <span data-testid="user-upload-file-name">
                    {selectedFile?.name || "Upload Image"}
                  </span>
                  <input
                    type="file"
                    className="hidden-file"
                    accept="image/*"
                    onChange={(event) =>
                      setSelectedFile(event.target.files?.[0] || null)
                    }
                    data-testid="user-upload-file-input"
                  />
                </label>
                <Textarea
                  placeholder="Message"
                  value={designForm.message}
                  onChange={(event) =>
                    setDesignForm((prev) => ({
                      ...prev,
                      message: event.target.value,
                    }))
                  }
                  data-testid="user-upload-message-input"
                  required
                />
                <Button
                  className="gold-btn align-end"
                  type="submit"
                  data-testid="user-upload-submit-button"
                >
                  Submit Design
                </Button>
              </form>
            </div>

            <div
              className="before-after-panel"
              data-testid="user-before-after-panel"
            >
              <h2
                className="section-title"
                data-testid="user-before-after-title"
              >
                Before &amp; After
              </h2>
              <div
                className="before-after-stage"
                data-testid="user-before-after-stage"
              >
                <img
                  src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80"
                  alt="before"
                  className="before-after-image"
                  data-testid="user-before-image"
                />
                <div
                  className="after-layer"
                  style={{ clipPath: `inset(0 ${100 - sliderValue}% 0 0)` }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?auto=format&fit=crop&w=1200&q=80"
                    alt="after"
                    className="before-after-image"
                    data-testid="user-after-image"
                  />
                </div>
                <div
                  className="slider-indicator"
                  style={{ left: `${sliderValue}%` }}
                  data-testid="user-slider-indicator"
                />
                <input
                  className="range-control"
                  type="range"
                  min="0"
                  max="100"
                  value={sliderValue}
                  onChange={(event) =>
                    setSliderValue(Number(event.target.value))
                  }
                  data-testid="user-before-after-slider"
                />
              </div>
            </div>
          </div>
        </section>

        <section
          className="dark-section"
          id="book"
          data-testid="user-book-order-section"
        >
          <div className="content-wrap contact-appointment-grid fade-up">
            <div
              className="contact-panel"
              id="contact"
              data-testid="user-contact-panel"
            >
              <h2
                className="section-title section-title-invert"
                data-testid="user-contact-title"
              >
                Contact Us
              </h2>
              <div className="contact-row" data-testid="user-contact-phone-row">
                <Phone size={18} />
                <p data-testid="user-contact-phone-text">{contact.phone}</p>
              </div>
              <div className="contact-row" data-testid="user-contact-email-row">
                <Mail size={18} />
                <p data-testid="user-contact-email-text">{contact.email}</p>
              </div>
              <div className="contact-row" data-testid="user-contact-hours-row">
                <Clock3 size={18} />
                <p data-testid="user-contact-hours-text">{contact.hours}</p>
              </div>
              <div
                className="contact-row"
                data-testid="user-contact-address-row"
              >
                <MapPin size={18} />
                <p data-testid="user-contact-address-text">{contact.address}</p>
              </div>
              <iframe
                src={contact.map_embed_url}
                title="map"
                className="map-frame"
                data-testid="user-contact-map-iframe"
              />
            </div>

            <div
              className="appointment-order-stack"
              data-testid="user-appointment-order-stack"
            >
              <div
                className="appointment-panel"
                data-testid="user-appointment-panel"
              >
                <h2
                  className="section-title section-title-invert"
                  data-testid="user-appointment-title"
                >
                  Book Appointment
                </h2>
                <form
                  onSubmit={submitAppointment}
                  className="stack-form"
                  data-testid="user-appointment-form"
                >
                  <Input
                    placeholder="Name"
                    value={appointmentForm.name}
                    onChange={(event) =>
                      setAppointmentForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    data-testid="user-appointment-name-input"
                    required
                    className="dark-input"
                  />
                  <Input
                    placeholder="Phone"
                    value={appointmentForm.phone}
                    onChange={(event) =>
                      setAppointmentForm((prev) => ({
                        ...prev,
                        phone: event.target.value,
                      }))
                    }
                    data-testid="user-appointment-phone-input"
                    required
                    className="dark-input"
                  />
                  <div
                    className="select-wrap"
                    data-testid="user-appointment-design-select-wrap"
                  >
                    <Scissors size={16} />
                    <select
                      value={appointmentForm.design_id}
                      onChange={(event) => {
                        const selected = designs.find(
                          (item) => item.id === event.target.value,
                        );
                        setAppointmentForm((prev) => ({
                          ...prev,
                          design_id: event.target.value,
                          design_title: selected?.title || "",
                        }));
                      }}
                      className="tailor-select"
                      data-testid="user-appointment-design-select"
                      required
                    >
                      <option value="">Select Design</option>
                      {designs.map((design) => (
                        <option
                          key={design.id}
                          value={design.id}
                          data-testid={`user-appointment-design-option-${design.id}`}
                        >
                          {design.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div
                    className="select-wrap"
                    data-testid="user-appointment-date-wrap"
                  >
                    <CalendarDays size={16} />
                    <Input
                      type="date"
                      value={appointmentForm.appointment_date}
                      onChange={(event) =>
                        setAppointmentForm((prev) => ({
                          ...prev,
                          appointment_date: event.target.value,
                        }))
                      }
                      data-testid="user-appointment-date-input"
                      required
                      className="dark-input"
                    />
                  </div>
                  <Textarea
                    placeholder="Notes"
                    value={appointmentForm.notes}
                    onChange={(event) =>
                      setAppointmentForm((prev) => ({
                        ...prev,
                        notes: event.target.value,
                      }))
                    }
                    data-testid="user-appointment-notes-input"
                    className="dark-input"
                  />
                  <Button
                    type="submit"
                    className="gold-btn"
                    data-testid="user-appointment-submit-button"
                  >
                    Confirm Booking
                  </Button>
                </form>
              </div>

              <div
                className="appointment-panel"
                id="order"
                data-testid="user-order-panel"
              >
                <h2
                  className="section-title section-title-invert"
                  data-testid="user-order-title"
                >
                  Place Order
                </h2>
                <form
                  onSubmit={submitOrder}
                  className="stack-form"
                  data-testid="user-order-form"
                >
                  <Input
                    placeholder="Name"
                    value={orderForm.name}
                    onChange={(event) =>
                      setOrderForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    data-testid="user-order-name-input"
                    required
                    className="dark-input"
                  />
                  <Input
                    placeholder="Phone"
                    value={orderForm.phone}
                    onChange={(event) =>
                      setOrderForm((prev) => ({
                        ...prev,
                        phone: event.target.value,
                      }))
                    }
                    data-testid="user-order-phone-input"
                    required
                    className="dark-input"
                  />
                  <div
                    className="select-wrap"
                    data-testid="user-order-design-select-wrap"
                  >
                    <ShoppingBag size={16} />
                    <select
                      value={orderForm.design_id}
                      onChange={(event) => {
                        const selected = designs.find(
                          (item) => item.id === event.target.value,
                        );
                        setOrderForm((prev) => ({
                          ...prev,
                          design_id: event.target.value,
                          design_title: selected?.title || "",
                        }));
                      }}
                      className="tailor-select"
                      data-testid="user-order-design-select"
                      required
                    >
                      <option value="">Select Design</option>
                      {designs.map((design) => (
                        <option
                          key={design.id}
                          value={design.id}
                          data-testid={`user-order-design-option-${design.id}`}
                        >
                          {design.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    value={orderForm.quantity}
                    onChange={(event) =>
                      setOrderForm((prev) => ({
                        ...prev,
                        quantity: Number(event.target.value),
                      }))
                    }
                    data-testid="user-order-quantity-input"
                    className="dark-input"
                    required
                  />
                  <Textarea
                    placeholder="Customization Notes"
                    value={orderForm.message}
                    onChange={(event) =>
                      setOrderForm((prev) => ({
                        ...prev,
                        message: event.target.value,
                      }))
                    }
                    data-testid="user-order-message-input"
                    className="dark-input"
                  />
                  <Button
                    type="submit"
                    className="gold-btn"
                    data-testid="user-order-submit-button"
                  >
                    Place Order
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer" data-testid="user-footer">
        <div className="content-wrap footer-inner">
          <p data-testid="user-footer-text">
            © {new Date().getFullYear()} Tour Tailor. Crafted with precision.
          </p>
          <div className="footer-links" data-testid="user-footer-links">
            <a href="#designs" data-testid="user-footer-designs-link">
              Designs
            </a>
            <a href="#book" data-testid="user-footer-book-link">
              Book
            </a>
            <a href="/admin/login" data-testid="user-footer-admin-link">
              Admin
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
