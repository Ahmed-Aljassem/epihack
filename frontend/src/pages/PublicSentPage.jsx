import { Link, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import PublicHeader from "../components/public/PublicHeader";
import { DEMO_REPORT_REFERENCE } from "../data/publicContent";

export default function PublicSentPage() {
  const navigate = useNavigate();
  return (
    <div className="sent-shell" style={{ position: "relative" }}>
      <PublicHeader minimal rightSlot={null} />
      <button
        type="button"
        className="sent-done"
        onClick={() => navigate("/")}
      >
        Done
      </button>

      <main className="sent-stage">
        <div className="sent-check" aria-hidden="true">
          <Check size={48} strokeWidth={2.2} />
        </div>
        <h1 className="sent-title">Sent.</h1>
        <p className="sent-copy">Thanks. That helps the team respond earlier.</p>
        <div className="sent-reference">
          {DEMO_REPORT_REFERENCE} · routed to Pima County partners
        </div>
        <div className="sent-actions">
          <Link className="btn btn-ghost" to="/report">
            Add more — if you have a minute
          </Link>
          <Link className="btn btn-primary" to="/">Go to Today</Link>
        </div>
      </main>
    </div>
  );
}
