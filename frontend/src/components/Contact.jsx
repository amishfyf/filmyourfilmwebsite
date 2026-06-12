import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import "./contact.css";

export default function Contact() {
  const containerRef = useRef(null);

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

  return (
    <section className="contact-wrapper" id="contact" ref={containerRef}>
      <div className="contact-left animate-up" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: "clamp(2rem, 5vw, 4.5rem)", letterSpacing: "-0.03em", maxWidth: "800px", margin: 0, lineHeight: 1 }} >
        <h1 >
          Got a project in mind?{" "}
          <a
            href="https://wa.me/919560699224?text=Hey%20Film%20your%20Film%2C%20lets%20talk%20on%20our%20Project"
            target="_blank"
            rel="noreferrer"
            className="contact-whatsapp-link"
          >
            <span>Let&apos;s talk</span>
          </a>
        </h1>
      </div>

      <div className="contact-right animate-up">
        <div className="bento-grid">
          <a
            href="mailto:ea@filmyourfilm.com"
            className="bento-card card-email"
          >
            <div className="card-logo">
              <i className="fa-solid fa-envelope"></i>
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
              <i className="fa-brands fa-linkedin-in"></i>
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
              <i className="fa-brands fa-instagram"></i>
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
              <i className="fa-brands fa-vimeo-v"></i>
            </div>
            <div className="card-content">
              <h3>Vimeo</h3>
              <p>@curiouswanderer</p>
            </div>
          </a>

          <a href="tel:9560699224" className="bento-card card-phone">
            <div className="card-logo">
              <i className="fa-solid fa-phone"></i>
            </div>
            <div className="card-content">
              <h3>Phone</h3>
              <p>+91 9560699224</p>
            </div>
          </a>
        </div>
      </div>
    </section >
  );
}
