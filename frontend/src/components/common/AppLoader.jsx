/*
Program author: One Health frontend team
Program purpose: Display an ultra-minimal loading state using three mission
icons while app routes/session resolve.
*/

import { Leaf, PawPrint, Users } from "lucide-react";

const LOADER_ICONS = [Users, PawPrint, Leaf];

export default function AppLoader() {
  return (
    <div className="loading-screen loading-screen--minimal" role="status" aria-live="polite" aria-label="Loading">
      <div className="loading-minimal-inline" aria-hidden="true">
        {LOADER_ICONS.map((Icon, index) => (
          <span key={index} className="loading-minimal-icon">
            <Icon size={15} strokeWidth={2.2} />
          </span>
        ))}
      </div>
    </div>
  );
}
