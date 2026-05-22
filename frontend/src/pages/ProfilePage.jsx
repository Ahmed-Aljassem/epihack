import { User, Mail, Building2, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();

  const name = user?.name || "L. Romero";
  const email = user?.email || "—";
  const role = user?.role ? user.role.replace(/_/g, " ") : "Epidemiologist";
  const org = user?.org || "Pima Co. · Epi";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const fields = [
    { icon: User,       label: "Full name",     value: name  },
    { icon: Mail,       label: "Email",         value: email },
    { icon: Shield,     label: "Role",          value: role  },
    { icon: Building2,  label: "Organization",  value: org   },
  ];

  return (
    <div>
      <div className="console-header">
        <div>
          <h1 className="console-title">Profile</h1>
          <p className="console-subtitle">
            Your account details as recorded in the One Health · AZ console.
          </p>
        </div>
      </div>

      <div className="profile-card card">
        <div className="profile-card-head">
          <div className="profile-avatar">{initials}</div>
          <div>
            <div className="profile-name">{name}</div>
            <div className="profile-org">{org}</div>
          </div>
        </div>

        <dl className="profile-fields">
          {fields.map(({ icon: Icon, label, value }) => (
            <div className="profile-field" key={label}>
              <dt>
                <Icon size={14} strokeWidth={2} />
                {label}
              </dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <div className="profile-footnote">
          Profile editing is coming soon. Contact your org admin to update these
          fields in the meantime.
        </div>
      </div>
    </div>
  );
}
