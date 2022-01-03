use admin;
db.createUser({
  user: "great_user",
  pwd: "great_pass",
  roles: [
    {
      role: "dbOwner",
      db: "application_database",
    },
  ],
});