const multer = require("multer");
const path = require("path");
const sharp = require("sharp");
const {isAuthenticated, isRole} = require("../tools/api.js");

module.exports = function(app) {

  const {db} = app.settings;

  app.post("/api/profile/update", isAuthenticated, (req, res) => {
    delete req.body.sharing;
    db.userprofiles.update(req.body, {where: {uid: req.user.id}}).then(u => res.json(u).end());  
  });

  app.post("/api/profile/setsharing", isRole(2), (req, res) => {
    const {uid} = req.body;
    db.userprofiles.update(req.body, {where: {uid}}).then(u => res.json(u).end());  
  });

  app.get("/api/profile/:username", isAuthenticated, (req, res) => {
    const {username} = req.params;
    let dbFields = ["users.id", "users.name", "users.email", "users.username"];

    if (req.user.username === username || true === true) {
      dbFields = dbFields.concat(["userprofiles.*, geos.name as geoname, schools.name as schoolname"]);
    }

    const q = `SELECT ${dbFields}
      FROM users
      FULL JOIN userprofiles on userprofiles.uid = users.id
      FULL JOIN geos on userprofiles.gid = geos.id
      FULL JOIN schools on userprofiles.sid = schools.id
      WHERE users.username = '${username}' LIMIT 1;`;

    db.query(q, {type: db.QueryTypes.SELECT}).then(users => {
      if (!users.length) {
        return res.json({error: "No user matched that username."});
      }

      const oldDate = new Date(users[0].last_upped);
      const now = new Date();
      if (now - oldDate > 1000 * 60 * 60 * 24 * 30) {
        users[0].last_upped = now.toLocaleDateString().replace("/", "-");
        users[0].reports = 5;
        const payload = {last_upped: users[0].last_upped, reports: users[0].reports};
        db.userprofiles.update(payload, {where: {uid: users[0].id}}).then(() => res.json(users[0]).end());  
      }
      else {
        return res.json(users[0]).end();
      }
    });
  });

  app.post("/api/profile/", isAuthenticated, (req, res) => {
    const {bio, cpf, dob, gender, gid, name, sid} = req.body;
    db.users.update(
      {name},
      {where: {id: req.user.id}}
    ).then(() => {
      db.userprofiles.findOrCreate({where: {uid: req.user.id}})
        .then(userprofiles => {
          if (userprofiles.length) {
            const userprofile = userprofiles[0];
            userprofile.bio = bio;
            userprofile.cpf = cpf;
            userprofile.dob = dob;
            userprofile.gender = gender;
            userprofile.gid = gid;
            userprofile.sid = sid;
            return userprofile.save().then(() => res.json(userprofile).end());
          }
          else {
            return res.json({error: "Unable to update user profile."}).end();
          }
        });
    });
  });

  // Multer is required to process file uploads and make them available via
  // req.files.
  const upload = multer({
    // storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024 // no larger than 5mb
    },
    fileFilter: (req, file, callback) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return callback(new Error("Only image files are allowed!"));
      }
      return callback(null, true);
    }
  });

  const imgUpload = upload.single("file");
  app.post("/api/profileImgUpload/", isAuthenticated, (req, res) => {
    imgUpload(req, res, err => {
      if (err) return res.json({error: err});

      if (!req.file) {
        return res.json({error: "No file."});
      }

      const sampleFile = req.file;
      const {id: uid} = req.user;
      // const userId = "test-123";
      const newFileName = `user${uid.replace(/-/g, "")}.jpg`;
      const imgPath = path.join(process.cwd(), "/static/uploads", newFileName);
      // return res.json({f: newFileName, f2: imgPath});

      sharp(sampleFile.buffer)
        .toFormat(sharp.format.jpeg)
        .resize(350, 350)
        .toFile(imgPath, (uploadErr, info) => {
          if (uploadErr) {
            return res.status(500).send(uploadErr);
          }
          else {
            db.userprofiles.update(
              {img: newFileName},
              {where: {uid}}
            ).then(() => {
              return res.json(info);
            });
          }
        });
    });
  });

  app.get("/api/schools", isAuthenticated, (req, res) => {
    db.schools.findAll(
      {where: {gid: {$ilike: "4mg%"}}}
    ).then(schools => res.json(schools));
  });

  app.get("/api/schoolsBySid", isAuthenticated, (req, res) => {
    const {sid} = req.query;
    const q = `SELECT schools.* FROM schools as s, schools WHERE s.id = '${sid}' AND s.gid = schools.gid;`;

    db.query(q, {type: db.QueryTypes.SELECT}).then(schools => res.json(schools));
  });

  app.get("/api/schoolsByGid", isAuthenticated, (req, res) => {
    const {gid} = req.query;
    db.schools.findAll(
      {where: {gid}}
    ).then(schools => res.json(schools));
  });

  app.get("/api/geos", isAuthenticated, (req, res) => {
    const {state} = req.query;
    db.geos.findAll(
      {where: {id: {$ilike: `${state}%`}, sumlevel: "MUNICIPALITY"}}
    ).then(geos => res.json(geos));
  });

};
