import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import './styles.css';

export default function Contact() {
  const containerRef = useRef(null);
  const blobRef = useRef(null);

  useGSAP(() => {
    if (!containerRef.current || !blobRef.current) {
      return undefined;
    }

    const xTo = gsap.quickTo(blobRef.current, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(blobRef.current, 'y', { duration: 0.6, ease: 'power3' });

    const moveBlob = (event) => {
      xTo(event.clientX - 250);
      yTo(event.clientY - 250);
    };

    const container = containerRef.current;
    container.addEventListener('mousemove', moveBlob);

    return () => container.removeEventListener('mousemove', moveBlob);
  }, { scope: containerRef });

  return (
    <section className="contact-section" id="contact" ref={containerRef}>
      <div className="blob" ref={blobRef}></div>
      <h1 className="contact-text">
        Got a project in mind? <span className="serif-italic">Let's talk.</span>
      </h1>
    </section>
  );
}
