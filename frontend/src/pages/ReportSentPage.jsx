import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle } from "lucide-react";
import PublicHeader from "../components/public/PublicHeader";

export default function ReportSentPage() {
  return (
    <div className="public-shell">
      <PublicHeader />

      <main className="public-layout">
        <section className="report-sent-container">
          <div className="report-sent-content">
            <div className="report-sent-icon">
              <CheckCircle size={56} strokeWidth={1.5} />
            </div>

            <h1>Thank you for your report</h1>
            <p className="report-sent-subtitle">
              Your report helps Arizona detect health threats early. Our team
              will review it and take action if needed.
            </p>

            <div className="report-sent-divider" />

            <div className="report-sent-cta">
              <h2>Want to stay updated?</h2>
              <p>
                Register to track your reports, receive alerts, and help
                coordinate response across Arizona.
              </p>
              <div className="report-sent-actions">
                <Link to="/register" className="btn btn-primary">
                  Create an account
                  <ArrowRight size={16} strokeWidth={2.2} />
                </Link>
                <Link to="/" className="btn btn-ghost">
                  Back to home
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
