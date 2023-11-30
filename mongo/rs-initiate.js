db.createUser({
  user: "<DB_USERNAME>",
  pwd: "<DB_PASSPORT>",
  roles: [
    {
      role: "readWrite",
      db: "<DB_NAME>",
    },
  ],
});

rs.initiate();
