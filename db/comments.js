module.exports = function(sequelize, db) {

  const c = sequelize.define("comments",
    {
      id: {
        type: db.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      uid: db.STRING,
      date: db.DATE,
      title: db.TEXT,
      content: db.TEXT,
      thread_id: db.INTEGER,
      status: db.TEXT     
    },
    {
      freezeTableName: true,
      timestamps: false
    }
  );

  c.associate = models => {
    c.belongsTo(models.userprofiles, {foreignKey: "uid", targetKey: "uid", as: "userprofile"});
    c.belongsTo(models.users, {foreignKey: "uid", targetKey: "id", as: "user"});
    c.hasMany(models.reports, {foreignKey: "report_id", sourceKey: "id", as: "reportlist"});
    //c.belongsTo(models.slides, {foreignKey: "subject_id", targetKey: "id", as: "slide"});
  };

  return c;

};
