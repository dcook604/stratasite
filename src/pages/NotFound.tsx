import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="page-container">
      <Navbar />
      <div id="main-content" className="page-content" tabIndex={-1}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center px-gutter">
            <h1 className="text-display-lg text-on-surface mb-4">404</h1>
            <p className="text-body-lg text-on-surface-variant mb-8">
              Oops! This page doesn't exist.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/"
                className="bg-primary-container text-on-primary px-6 py-3 rounded-xl text-title-lg hover:brightness-110 transition-all inline-flex items-center"
              >
                Return to Home
              </Link>
              <Link
                to="/support"
                className="bg-surface border border-outline-variant text-on-surface px-6 py-3 rounded-xl text-title-lg hover:bg-surface-container transition-all inline-flex items-center"
              >
                Help &amp; Support
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;
