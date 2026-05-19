// MongoDB initialization script
db = db.getSiblingDB("epidemic_radar");

db.createCollection("users");
db.createCollection("surveys");
db.createCollection("responses");
db.createCollection("alerts");
db.createCollection("locations");

// Indexes for performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

db.surveys.createIndex({ category: 1 });
db.surveys.createIndex({ status: 1 });
db.surveys.createIndex({ created_at: -1 });

db.responses.createIndex({ survey_id: 1 });
db.responses.createIndex({ user_id: 1 });
db.responses.createIndex({ submitted_at: -1 });
db.responses.createIndex({ "location.coordinates": "2dsphere" });

db.alerts.createIndex({ severity: 1 });
db.alerts.createIndex({ category: 1 });
db.alerts.createIndex({ created_at: -1 });
db.alerts.createIndex({ "location.coordinates": "2dsphere" });

print("Epidemic Radar DB initialized with collections and indexes.");
