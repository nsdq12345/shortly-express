const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  // if (Object.keys(req.cookies).length === 0) {
    return models.Sessions.create()
    .then((data) => {
      var inquiryID = {id: data.insertId};
      return models.Sessions.get(inquiryID)
    })
    .then((data) => {
      var hash = data.hash;
      req.session =  {hash: hash};
      res.cookies = {shortlyid: {value: hash}};
      if (data.userId) {
        return models.Users.getUserById({id: data.userId})
        .then((data) => {console.log(data); next()});
      } else {
        var hashID = req.cookies.shortlyid;

        if (hashID) {
          return models.Sessions.get({hash: hashID})
          .then((data) => {
            if (data) {
              var userId = data.userId;
              return models.Users.getUserById({id: userId})
              .then((data) =>{
                if (data) {
                  req.session.user = {username: data.username};
                  req.session.userId = data.id;
                }
                next();
              })
            }
            next();
          })
        }
      }

      next();
    })
  // } else if (Object.keys(req.cookies).length) {
  //   var sessionValue = req.cookies.shortlyid;
  //   return
  // }

};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

