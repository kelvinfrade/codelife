const {isAuthenticated, isRole} = require("../tools/api.js");

module.exports = function(app) {

  const {db} = app.settings;

  /*
  app.get("/api/likes/byid", isAuthenticated, (req, res) => {
    db.likes.findAll({where: {likeid: req.query.id}}).then(u => res.json(u).end());
  });
  */

  // Used by Level, CodeBlockList, and UserCodeblocks to get like counts
  app.get("/api/likes", isAuthenticated, (req, res) => {
    db.likes.findAll({where: {uid: req.user.id}}).then(u => res.json(u).end());
  });

  // Used by CodeBlockCard to actually process the like
  app.post("/api/likes/save", isAuthenticated, (req, res) => {
    const uid = req.user.id;
    const {liked, likeid} = req.body;

    if (!liked) {
      db.likes.destroy({where: {uid, likeid}}).then(u => res.json(u).end());
    }
    else {
      db.likes.findOrCreate({where: {uid, likeid}}).then(u => res.json(u).end());
    }

  });

};
