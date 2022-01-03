var admin = db.getSiblingDB("admin");
admin.createUser({
  user: "myUserAdmin",
  pwd: "pass", // or cleartext password
  roles: [
    { role: "userAdminAnyDatabase", db: "admin" },
    { role: "readWriteAnyDatabase", db: "admin" },
  ],
});
