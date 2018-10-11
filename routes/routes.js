var superagent = require("superagent");
const nonce = require('nonce')();
const cookie = require('cookie');
const crypto = require('crypto');
const querystring = require('querystring');
const request = require('request-promise');


const apiKey = "a35d53496a9148de40d1652be43fd9d3";//process.env.SHOPIFY_API_KEY;
const apiSecret = "2c457122c3e7372ed5dae081cdd130c3"; //process.env.SHOPIFY_API_SECRET;
const shopifytoken = process.env.SHOPIFY_TOKEN;
const scopes = "read_products";
const forwardingAddress = "https://mnk-courier-app.herokuapp.com";

var appRouter = function(app) {

  //home page
  app.get('/', function(req,res){
     //ejs render
     res.render('index');
  });

  app.get("/orders", function(req, res) {
    superagent
      .get("https://zinnga.myshopify.com/admin/orders.json")
      .set("Accept", "application/json")
      //.set('X-Shopify-Storefront-Access-Token', shopifytoken)
      .auth("f48c2679dcae5ef7a399444b45ab5c95", "fd69fe9f795a4a6248e415b2f1a9907b")
      .end((err, response) => {
        if (err) {
          return console.log(err);
        }
        res.send(response.body);
      });
  });

  //install url: /shopify
  app.get("/shopify", (req, res) => {
    const shop = req.query.shop;
    if (shop) {
      const state = nonce();
      const redirectUri = forwardingAddress + "/shopify/callback";
      const installUrl =
        "https://" +
        shop +
        "/admin/oauth/authorize?client_id=" +
        apiKey +
        "&scope=" +
        scopes +
        "&state=" +
        state +
        "&redirect_uri=" +
        redirectUri;

      res.cookie("state", state);
      res.redirect(installUrl);
    } else {
      return res
        .status(400)
        .send(
          "Missing shop parameter. Please add ?shop=your-development-shop.myshopify.com to your request"
        );
    }
  });

  //redirect url: /shopify/callback
  app.get("/shopify/callback", (req, res) => {
    const { shop, hmac, code, state } = req.query;
    const stateCookie = cookie.parse(req.headers.cookie).state;

    if (state !== stateCookie) {
      return res.status(403).send("Request origin cannot be verified");
    }

    if (shop && hmac && code) {
      if(!validateRequest(req)) {
        return "Request invalid or not from shopify";
      }

      // TODO
      // Validate request is from Shopify
      // Exchange temporary code for a permanent access token
      // Use access token to make API call to 'shop' endpoint
    } else {
      res.status(400).send("Required parameters missing");
    }
  });

  function validateRequest(req) {
    const map = Object.assign({}, req.query);
    delete map["signature"];
    delete map["hmac"];
    const message = querystring.stringify(map);
    const providedHmac = Buffer.from(hmac, "utf-8");
    const generatedHash = Buffer.from(
      crypto
        .createHmac("sha256", apiSecret)
        .update(message)
        .digest("hex"),
      "utf-8"
    );
    let hashEquals = false;
    // timingSafeEqual will prevent any timing attacks. Arguments must be buffers
    try {
      hashEquals = crypto.timingSafeEqual(generatedHash, providedHmac);
      // timingSafeEqual will return an error if the input buffers are not the same length.
    } catch (e) {
      hashEquals = false;
    }

    if (!hashEquals) {
      return false; //res.status(400).send("HMAC validation failed");
    }
    return true;
    //res.status(200).send("HMAC validated");
  }
};

module.exports = appRouter;
