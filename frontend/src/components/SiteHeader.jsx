import { Link, useLocation } from "react-router";

export default function SiteHeader() {
  const location = useLocation();
  const isWorkPage = location.pathname.startsWith('/work');
  const isContactPage = location.pathname.startsWith('/contact');

  const handleScroll = (e, target) => {
    if (location.pathname !== "/") return;
    e.preventDefault();
    if (window.lenis) {
      window.lenis.scrollTo(target, { duration: 1.2 });
    } else {
      if (target === 0) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <header className={`site-header ${isWorkPage || isContactPage ? "site-header-work" : ""}`}>
      <Link className="site-logo" to="/" onClick={(e) => handleScroll(e, 0)}>
        <img
          alt="Film Your Film"
          className="site-logo-mark"
          src="https://cdn.prod.website-files.com/64d4cabf6efb73a26f743da1/6721fa0cfcccdb249886dfa3_Animation.gif"
        />
      </Link>
      <nav className="site-nav">
        <Link 
          to="/" 
          onClick={(e) => handleScroll(e, 0)}
        >
          Home
        </Link>
        <Link to="/work" aria-current={isWorkPage ? "page" : undefined}>
          WORKLINKS
        </Link>
        <Link 
          to="/contact" 
          aria-current={isContactPage ? "page" : undefined}
        >
          Contact
        </Link>
      </nav>
    </header>
  );
}
