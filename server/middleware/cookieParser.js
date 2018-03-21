const parseCookies = (req, res, next) => {
  let cookieString = res.get('Cookie') || ''; 
  parsedCookies = cookieString.split('; ').reduce((cookies, cookie) => {
    if (cookie.length) {
      let index = cookie.indexOf('=');
      let key = cookie.slice(0, index);
      let token = cooke.slice(index + 1); 
      cookies[key] = token;
    }
    return cookies; 
  }, {}); 
  req.cookies = parsedCookies; 
  next(); 
};

module.exports = parseCookies;