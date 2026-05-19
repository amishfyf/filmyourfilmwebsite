import React, { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import "./contact.css";

export default function Contact() {
  const containerRef = useRef(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState("idle");

  // Subtle entrance animation
  useGSAP(
    () => {
      gsap.fromTo(
        ".animate-up",
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: containerRef.current },
        },
      );
    },
    { scope: containerRef },
  );

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch (error) {
      console.error("Submission failed", error);
      setStatus("error");
    }
  };

  return (
    <section className="contact-wrapper" id="contact" ref={containerRef}>
      <div className="contact-left animate-up">
        <h1 className="contact-heading">
          Let's make
          <br />
          something together.
        </h1>

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="input-row">
            <div className="input-group">
              <input
                type="text"
                id="name"
                placeholder=" "
                value={formData.name}
                onChange={handleChange}
                required
              />
              <label htmlFor="name">Name</label>
            </div>
            <div className="input-group">
              <input
                type="email"
                id="email"
                placeholder=" "
                value={formData.email}
                onChange={handleChange}
                required
              />
              <label htmlFor="email">Email</label>
            </div>
          </div>

          <div className="input-group">
            <textarea
              id="message"
              rows="4"
              placeholder=" "
              value={formData.message}
              onChange={handleChange}
              required
            ></textarea>
            <label htmlFor="message">Message</label>
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={status === "loading"}
          >
            {status === "loading"
              ? "Sending..."
              : status === "success"
                ? "Sent!"
                : "Submit"}
          </button>

          {status === "error" && (
            <p style={{ color: "red", marginTop: "1rem" }}>
              Something went wrong. Please try again.
            </p>
          )}
        </form>
      </div>

      <div className="contact-right animate-up">
        <div className="bento-grid">
          <a
            href="mailto:ea@filmyourfilm.com"
            className="bento-card card-email"
          >
            <div className="card-logo">
              <img src="/email.svg" alt="Email" />
            </div>
            <div className="card-content">
              <h3>Email</h3>
              <p>ea@filmyourfilm.com</p>
            </div>
          </a>

          <a
            href="https://www.linkedin.com/company/film-your-film/people/"
            target="_blank"
            rel="noreferrer"
            className="bento-card card-linkedin"
          >
            <div className="card-logo">
              <img src="/linkedin.svg" alt="LinkedIn" />
            </div>
            <div className="card-content">
              <h3>LinkedIn</h3>
              <p>Film Your Film</p>
            </div>
          </a>

          <a
            href="https://www.instagram.com/filmyourfilm/"
            target="_blank"
            rel="noreferrer"
            className="bento-card card-instagram"
          >
            <div className="card-logo">
              <img src="/instagram.svg" alt="Instagram" />
            </div>
            <div className="card-content">
              <h3>Instagram</h3>
              <p>@filmyourfilm</p>
            </div>
          </a>

          <a
            href="https://vimeo.com/curiouswanderer"
            target="_blank"
            rel="noreferrer"
            className="bento-card card-vimeo"
          >
            <div className="card-logo">
              <img src="/vimeo.svg" alt="Vimeo" />
            </div>
            <div className="card-content">
              <h3>Vimeo</h3>
              <p>@curiouswanderer</p>
            </div>
          </a>

          <a href="tel:9888899224" className="bento-card card-phone">
            <div className="card-logo">
              <img src="/phone.svg" alt="Phone" />
            </div>
            <div className="card-content">
              <h3>Phone</h3>
              <p>+91 9888899224</p>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
