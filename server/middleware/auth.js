const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  // if (Object.keys(req.cookies).length === 0) {
    console.log('BODY:', req.body)
    return models.Sessions.create()
    .then((data) => {
      console.log('DATA1:', data);
      var inquiryID = {id: data.insertId};
      return models.Sessions.get(inquiryID)
    })
    .then((data) => {
      console.log('DATA2:', data);
      var hash = data.hash;
      req.session =  {hash: hash};
      req.cookies = {shortlyid: hash};

        var cookieHash = "shortlyid=" + hash
        res.cookie('shortlyid', hash)

      if (data.userId) {
        console.log('hit');
        return models.Users.getUserById({id: data.userId})
        .then((data) => {console.log(data); next()});
      } else if (req.body.username) {

        return models.Users.get({username: req.body.username})
        .then(data => {
          console.log("DATA3:", data);
        })

      } else {
        var hashID = req.cookies.shortlyid;
        console.log('hashID', hashID);
        if (hashID) {
          return models.Sessions.get({hash: hashID})
          .then((data) => {
            if (data) {
              console.log('hit');
              var userId = data.userId;
              return models.Users.getUserById({id: userId})
              .then((data) =>{
                console.log('hit2');
                if (data) {
                  console.log('hit3');
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

