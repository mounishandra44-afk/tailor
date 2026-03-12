import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { CalendarDays, Clock3, Mail, MapPin, Phone, Scissors, Upload } from "lucide-react";
import { Toaster, toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import "@/App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FALLBACK_SERVICES = [
  {
    id: "srv-men-suits",
    title: "Men's Suits",
    category: "men",
    description: "Custom-tailored suits with premium construction for a sharp look.",
    image_url:
      "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=900&q=80",
    cta_text: "View Designs",
  },
  {
    id: "srv-women-dresses",
    title: "Women's Dresses",
    category: "women",
    description: "Stylish dresses crafted for your preferred fit and personality.",
    image_url:
      "https://images.pexels.com/photos/1462637/pexels-photo-1462637.jpeg?auto=compress&cs=tinysrgb&w=900",
    cta_text: "View Designs",
  },
  {
    id: "srv-bridal",
    title: "Bridal Wear",
    category: "bridal",
    description: "Exquisite bridal wear tailored with attention to details.",
    image_url:
      "https://images.pexels.com/photos/265722/pexels-photo-265722.jpeg?auto=compress&cs=tinysrgb&w=900",
    cta_text: "View Designs",
  },
  {
    id: "srv-alterations",
    title: "Alterations",
    category: "alterations",
    description: "Professional alterations and refinements for a perfect fit.",
    image_url:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80",
    cta_text: "View Designs",
  },
];

const FALLBACK_GALLERY = [
  {
    id: "gal-men-1",
    category: "men",
    title: "Classic Navy Three-Piece",
    image_url:
      "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=900",
  },
  {
    id: "gal-men-2",
    category: "men",
    title: "Modern Formal Suit",
    image_url:
      "https://images.unsplash.com/photo-1610652492500-ded49ceeb378?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "gal-women-1",
    category: "women",
    title: "Elegant Evening Dress",
    image_url:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "gal-bridal-1",
    category: "bridal",
    title: "Bridal Satin Gown",
    image_url:
      "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=900",
  },
];

const FALLBACK_CONTACT = {
  shop_name: "Tour Tailor",
  phone: "+123 456 7890",
  email: "info@yourtailor.com",
  hours: "Mon - Sat: 10:00 AM - 7:00 PM",
  address: "214 Heritage Street, Fashion District",
  map_embed_url: "https://www.google.com/maps?q=Savile+Row+London&output=embed",
  whatsapp_number: "1234567890",
};

const FALLBACK_IMAGE_URL =
  "https://images.pexels.com/photos/1021693/pexels-photo-1021693.jpeg?auto=compress&cs=tinysrgb&w=900";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Services", href: "#services" },
  { label: "Gallery", href: "#gallery" },
  { label: "Contact", href: "#contact" },
];

const GALLERY_TABS = [
  { label: "All", value: "all" },
  { label: "Men's", value: "men" },
  { label: "Women's", value: "women" },
  { label: "Bridal", value: "bridal" },
];

const App = () => {
  const [services, setServices] = useState(FALLBACK_SERVICES);
  const [gallery, setGallery] = useState(FALLBACK_GALLERY);
  const [contact, setContact] = useState(FALLBACK_CONTACT);
  const [activeCategory, setActiveCategory] = useState("all");
  const [sliderValue, setSliderValue] = useState(50);
  const [selectedFile, setSelectedFile] = useState(null);
  const [submittingDesign, setSubmittingDesign] = useState(false);
  const [submittingAppointment, setSubmittingAppointment] = useState(false);

  const [designForm, setDesignForm] = useState({
    name: "",
    phone: "",
    message: "",
    style_category: "",
  });

  const [appointmentForm, setAppointmentForm] = useState({
    name: "",
    phone: "",
    service_type: "",
    appointment_date: "",
    notes: "",
  });

  useEffect(() => {
    const loadContent = async () => {
      try {
        const [servicesRes, galleryRes, contactRes] = await Promise.all([
          axios.get(`${API}/content/services`),
          axios.get(`${API}/content/gallery`),
          axios.get(`${API}/content/contact`),
        ]);
        setServices(servicesRes.data);
        setGallery(galleryRes.data);
        setContact(contactRes.data);
      } catch (error) {
        toast.error("Using starter content while API data loads.");
      }
    };

    loadContent();
  }, []);

  const whatsappLink = useMemo(() => {
    const text = encodeURIComponent("Hi, I want to place a tailoring order.");
    return `https://wa.me/${contact.whatsapp_number}?text=${text}`;
  }, [contact.whatsapp_number]);

  const handleDesignSubmit = async (event) => {
    event.preventDefault();
    setSubmittingDesign(true);
    try {
      await axios.post(`${API}/design-requests`, {
        ...designForm,
        image_name: selectedFile?.name || "",
      });
      toast.success("Your design request has been submitted.");
      setDesignForm({ name: "", phone: "", message: "", style_category: "" });
      setSelectedFile(null);
    } catch (error) {
      toast.error("Unable to submit your design request. Please try again.");
    } finally {
      setSubmittingDesign(false);
    }
  };

  const handleAppointmentSubmit = async (event) => {
    event.preventDefault();
    setSubmittingAppointment(true);
    try {
      await axios.post(`${API}/appointments`, appointmentForm);
      toast.success("Appointment booked successfully.");
      setAppointmentForm({
        name: "",
        phone: "",
        service_type: "",
        appointment_date: "",
        notes: "",
      });
    } catch (error) {
      toast.error("Booking failed. Please verify details and retry.");
    } finally {
      setSubmittingAppointment(false);
    }
  };

  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = FALLBACK_IMAGE_URL;
  };

  return (
    <div className="tailor-app" data-testid="tailor-app-root">
      <header className="top-nav" data-testid="top-navigation">
        <div className="content-wrap nav-shell">
          <a href="#home" className="brand" data-testid="brand-logo-link">
            Tour Tailor
          </a>
          <nav className="nav-links" data-testid="top-navigation-links">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="nav-link"
                data-testid={`nav-link-${link.label.toLowerCase()}`}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <a href="#appointment" className="nav-cta-link" data-testid="nav-book-appointment-link">
            <Button className="gold-btn" data-testid="nav-book-appointment-button">
              Book Appointment
            </Button>
          </a>
        </div>
      </header>

      <main data-testid="main-content">
        <section className="hero-section" id="home" data-testid="hero-section">
          <img
            src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1800&q=80"
            alt="Tailor at work"
            className="hero-image"
            data-testid="hero-background-image"
          />
          <div className="hero-overlay" />
          <div className="content-wrap hero-content fade-up" data-testid="hero-content-wrapper">
            <p className="hero-tag" data-testid="hero-brand-tagline">
              Bespoke Tailoring Studio
            </p>
            <h1 className="hero-title" data-testid="hero-main-heading">
              Perfect Stitch. Perfect Fit.
            </h1>
            <p className="hero-subtitle" data-testid="hero-subheading-text">
              Personalized tailoring for suits, dresses, bridal wear, and alterations with handcrafted precision.
            </p>
            <div className="hero-actions" data-testid="hero-action-buttons">
              <a href="#appointment" data-testid="hero-book-appointment-link">
                <Button className="gold-btn" data-testid="hero-book-appointment-button">
                  Book Appointment
                </Button>
              </a>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                data-testid="hero-whatsapp-order-link"
              >
                <Button className="whatsapp-btn" data-testid="hero-whatsapp-order-button">
                  WhatsApp Order
                </Button>
              </a>
            </div>
          </div>
        </section>

        <section className="light-section" data-testid="about-section">
          <div className="content-wrap about-grid fade-up">
            <div className="media-frame" data-testid="about-image-frame">
              <img
                src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=80"
                alt="Tailor stitching"
                className="section-image"
                data-testid="about-section-image"
              />
            </div>
            <div className="about-text" data-testid="about-text-content">
              <h2 className="section-title" data-testid="about-section-heading">
                About Us
              </h2>
              <p className="section-description" data-testid="about-section-description">
                With over 15 years of experience, our atelier creates garments that celebrate your style and fit.
                From bespoke suits to bridal couture, every piece is measured, drafted, and finished with care.
              </p>
            </div>
          </div>
        </section>

        <section className="dark-section" id="services" data-testid="services-section">
          <div className="content-wrap fade-up">
            <h2 className="section-title section-title-invert" data-testid="services-section-heading">
              Our Services
            </h2>
            <div className="services-grid" data-testid="services-grid-container">
              {services.map((service) => (
                <Card className="service-card" key={service.id} data-testid={`service-card-${service.id}`}>
                  <img
                    src={service.image_url}
                    alt={service.title}
                    className="service-image"
                    onError={handleImageError}
                    data-testid={`service-card-image-${service.id}`}
                  />
                  <CardContent className="service-content">
                    <h3 className="service-title" data-testid={`service-card-title-${service.id}`}>
                      {service.title}
                    </h3>
                    <p className="service-description" data-testid={`service-card-description-${service.id}`}>
                      {service.description}
                    </p>
                    <Button className="outline-gold-btn" data-testid={`service-card-action-${service.id}`}>
                      {service.cta_text}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="dark-section" id="gallery" data-testid="gallery-section">
          <div className="content-wrap fade-up">
            <h2 className="section-title section-title-invert" data-testid="gallery-section-heading">
              Gallery
            </h2>
            <Tabs value={activeCategory} onValueChange={setActiveCategory} data-testid="gallery-category-tabs">
              <TabsList className="gallery-tabs-list" data-testid="gallery-tabs-list">
                {GALLERY_TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="gallery-tab-trigger"
                    data-testid={`gallery-tab-${tab.value}`}
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {GALLERY_TABS.map((tab) => {
                const items =
                  tab.value === "all"
                    ? gallery
                    : gallery.filter((item) => item.category === tab.value);
                return (
                  <TabsContent
                    value={tab.value}
                    key={tab.value}
                    className="gallery-tab-panel"
                    data-testid={`gallery-tab-panel-${tab.value}`}
                  >
                    <div className="gallery-grid" data-testid={`gallery-grid-${tab.value}`}>
                      {items.map((item) => (
                        <article
                          key={item.id}
                          className="gallery-item"
                          data-testid={`gallery-item-${tab.value}-${item.id}`}
                        >
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="gallery-image"
                            onError={handleImageError}
                            data-testid={`gallery-item-image-${item.id}`}
                          />
                          <p className="gallery-caption" data-testid={`gallery-item-caption-${item.id}`}>
                            {item.title}
                          </p>
                        </article>
                      ))}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
        </section>

        <section className="light-section" data-testid="design-and-before-after-section">
          <div className="content-wrap dual-grid fade-up">
            <div className="form-panel" data-testid="upload-design-panel">
              <h2 className="section-title" data-testid="upload-design-heading">
                Upload Your Design
              </h2>
              <form onSubmit={handleDesignSubmit} className="stack-form" data-testid="upload-design-form">
                <Input
                  value={designForm.name}
                  onChange={(e) => setDesignForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Your Name"
                  required
                  className="tailor-input"
                  data-testid="upload-design-name-input"
                />
                <Input
                  value={designForm.phone}
                  onChange={(e) => setDesignForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="Phone Number"
                  required
                  className="tailor-input"
                  data-testid="upload-design-phone-input"
                />
                <Input
                  value={designForm.style_category}
                  onChange={(e) => setDesignForm((prev) => ({ ...prev, style_category: e.target.value }))}
                  placeholder="Design Category (Men / Women / Bridal)"
                  className="tailor-input"
                  data-testid="upload-design-category-input"
                />
                <label className="file-label" data-testid="upload-design-file-label">
                  <Upload size={16} />
                  <span data-testid="upload-design-file-label-text">
                    {selectedFile ? selectedFile.name : "Upload Image"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden-file"
                    data-testid="upload-design-file-input"
                  />
                </label>
                <Textarea
                  value={designForm.message}
                  onChange={(e) => setDesignForm((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Message"
                  required
                  className="tailor-input tailor-textarea"
                  data-testid="upload-design-message-input"
                />
                <Button
                  type="submit"
                  className="gold-btn align-end"
                  disabled={submittingDesign}
                  data-testid="upload-design-submit-button"
                >
                  {submittingDesign ? "Submitting..." : "Submit"}
                </Button>
              </form>
            </div>

            <div className="before-after-panel" data-testid="before-after-panel">
              <h2 className="section-title" data-testid="before-after-heading">
                Before &amp; After
              </h2>
              <div className="before-after-stage" data-testid="before-after-stage">
                <img
                  src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80"
                  alt="Before tailoring"
                  className="before-after-image"
                  data-testid="before-image"
                />
                <div
                  className="after-layer"
                  style={{ clipPath: `inset(0 ${100 - sliderValue}% 0 0)` }}
                  data-testid="after-layer"
                >
                  <img
                    src="https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?auto=format&fit=crop&w=1200&q=80"
                    alt="After tailoring"
                    className="before-after-image"
                    data-testid="after-image"
                  />
                </div>
                <div
                  className="slider-indicator"
                  style={{ left: `${sliderValue}%` }}
                  data-testid="before-after-slider-indicator"
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderValue}
                  onChange={(e) => setSliderValue(Number(e.target.value))}
                  className="range-control"
                  data-testid="before-after-range-slider"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="dark-section" id="contact" data-testid="contact-and-appointment-section">
          <div className="content-wrap contact-appointment-grid fade-up">
            <div className="contact-panel" data-testid="contact-info-panel">
              <h2 className="section-title section-title-invert" data-testid="contact-section-heading">
                Contact Us
              </h2>
              <div className="contact-row" data-testid="contact-phone-row">
                <Phone size={18} />
                <p data-testid="contact-phone-text">{contact.phone}</p>
              </div>
              <div className="contact-row" data-testid="contact-email-row">
                <Mail size={18} />
                <p data-testid="contact-email-text">{contact.email}</p>
              </div>
              <div className="contact-row" data-testid="contact-hours-row">
                <Clock3 size={18} />
                <p data-testid="contact-hours-text">{contact.hours}</p>
              </div>
              <div className="contact-row" data-testid="contact-address-row">
                <MapPin size={18} />
                <p data-testid="contact-address-text">{contact.address}</p>
              </div>
              <iframe
                src={contact.map_embed_url}
                className="map-frame"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Tailor location map"
                data-testid="contact-map-embed"
              />
            </div>

            <div className="appointment-panel" id="appointment" data-testid="appointment-panel">
              <h2 className="section-title section-title-invert" data-testid="appointment-section-heading">
                Book an Appointment
              </h2>
              <form
                onSubmit={handleAppointmentSubmit}
                className="stack-form"
                data-testid="appointment-booking-form"
              >
                <Input
                  value={appointmentForm.name}
                  onChange={(e) => setAppointmentForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Name"
                  required
                  className="tailor-input dark-input"
                  data-testid="appointment-name-input"
                />
                <Input
                  value={appointmentForm.phone}
                  onChange={(e) => setAppointmentForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="Phone"
                  required
                  className="tailor-input dark-input"
                  data-testid="appointment-phone-input"
                />
                <div className="select-wrap" data-testid="appointment-service-select-wrapper">
                  <Scissors size={16} />
                  <select
                    value={appointmentForm.service_type}
                    onChange={(e) =>
                      setAppointmentForm((prev) => ({ ...prev, service_type: e.target.value }))
                    }
                    required
                    className="tailor-select"
                    data-testid="appointment-service-select"
                  >
                    <option value="">Select Service Type</option>
                    {services.map((service) => (
                      <option value={service.title} key={service.id} data-testid={`appointment-service-${service.id}`}>
                        {service.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="select-wrap" data-testid="appointment-date-wrapper">
                  <CalendarDays size={16} />
                  <Input
                    type="date"
                    value={appointmentForm.appointment_date}
                    onChange={(e) =>
                      setAppointmentForm((prev) => ({ ...prev, appointment_date: e.target.value }))
                    }
                    required
                    className="tailor-input dark-input"
                    data-testid="appointment-date-input"
                  />
                </div>
                <Textarea
                  value={appointmentForm.notes}
                  onChange={(e) => setAppointmentForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Special requests"
                  className="tailor-input dark-input tailor-textarea"
                  data-testid="appointment-notes-input"
                />
                <Button
                  type="submit"
                  className="gold-btn"
                  disabled={submittingAppointment}
                  data-testid="appointment-submit-button"
                >
                  {submittingAppointment ? "Booking..." : "Confirm Booking"}
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer" data-testid="site-footer">
        <div className="content-wrap footer-inner">
          <p data-testid="footer-brand-text">© {new Date().getFullYear()} Tour Tailor. Crafted with precision.</p>
          <div className="footer-links" data-testid="footer-links-group">
            <a href="#services" data-testid="footer-services-link">
              Services
            </a>
            <a href="#gallery" data-testid="footer-gallery-link">
              Gallery
            </a>
            <a href="#contact" data-testid="footer-contact-link">
              Contact
            </a>
          </div>
        </div>
      </footer>

      <Toaster richColors position="top-right" />
    </div>
  );
};

export default App;
