const parseCookies = (req, res, next) => {
  if (req.headers.cookie) {
    var requestCookies = req.headers.cookie;
    var cookieArray = requestCookies.split('; ');
    var cookObject = {};
    cookieArray.forEach(function(ele){
      var cookie = ele.split('=');
      cookObject[cookie[0]] = cookie[1];
    })

    req.cookies = cookObject;
  } else {
    req.cookies = {};
  }

  next();
};

module.exports = parseCookies;
