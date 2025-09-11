//core module
const path = require("path");

//external module
const express = require("express");
const { default: mongoose } = require("mongoose");
const cors = require("cors");
const cookieparser = require("cookie-parser");
const session = require("express-session");
const MongodbStore = require("connect-mongodb-session")(session);
const multer = require("multer");
require('dotenv').config();

//local module
const rootDir = require("./utils/pathUtil");
const chefRouter = require("./routes/chefRouter");
const serviceRouter = require("./routes/serviceRouter");
const authRouter = require("./routes/authRouter");
const contactRouter = require("./routes/contactRouter");
const userRouter = require("./routes/userRouter");
const bookingRouter = require("./routes/bookingRouter");
const bookingHistoryRouter = require("./routes/bookingHistoryRouter");
const hostRouter = require("./routes/hostRouter");

//mongo path
const DB_path = process.env.DB_PATH;

const store = new MongodbStore({
  uri: DB_path,
  collection: "sessions",
  ttl: 60 * 5,
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(rootDir, "upload"));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const fileFilter = (req, file, cb) => {
  if (["image/png", "image/jpg", "image/jpeg"].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const app = express();
//cookie parsing
app.use(cookieparser());

//body parsing
app.use(express.urlencoded({ extended: true }));

//json->javascript
app.use(express.json());

app.use(multer({ storage, fileFilter }).single("image"));
app.use(express.static(path.join(rootDir, "public")));
app.use("/upload", express.static(path.join(rootDir, "upload")));
//session
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
      maxAge: 1000 * 60 * 5, // 5 minutes in milliseconds
      secure: false,
      httpOnly: true,
      sameSite: "Lax", // Adjust based on your requirements
    },
  })
);

app.use(
  cors({
    origin: ["https://chefbookinguser.netlify.app","https://chefbookingchef.netlify.app","https://chefbookinghost.netlify.app"], // specify your frontend origin
    credentials: true,
  })
);

app.use(userRouter);
app.use(authRouter);
app.use(serviceRouter);
app.use(chefRouter);
app.use(contactRouter);
app.use(bookingRouter);
app.use(bookingHistoryRouter);
app.use(hostRouter);

const PORT = 3001;

mongoose
  .connect(DB_path)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`server running at: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.log("error while connecting");
  });
