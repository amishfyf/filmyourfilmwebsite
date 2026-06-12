import { useEffect } from "react";
import SiteHeader from "./SiteHeader";
import Contact from "./Contact";
import "./WorkPage.css";

export default function ContactPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="work-page-shell">
      <SiteHeader />
      <Contact />
      {/* <main >
      </main> */}
    </div>
  );
}
