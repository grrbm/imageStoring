//var admin = db.getSiblingDB("admin");
db.createUser({
  user: "application_user",
  pwd: "application_pass",
  roles: [
    {
      role: "dbOwner",
      db: "ImageStoring",
    },
  ],
});
