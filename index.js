"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const config = require("./config");

// - setup -
const FILES_DIR = __dirname + "/text-files";
// create the express app
const app = express();

// - use middleware -
// allow Cross Origin Resource Sharing
app.use(cors());
// parse the body
app.use(bodyParser.raw({ type: "text/plain" }));
app.use(bodyParser.json());

// https://github.com/expressjs/morgan#write-logs-to-a-file
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);
app.use(morgan("combined", { stream: accessLogStream }));
// and log to the console
app.use(morgan("dev"));

// statically serve the frontend
app.use(express.static("public"));

// - declare routes -

// read all file names
app.get("/files", (req, res, next) => {
  fs.readdir(FILES_DIR, (err, list) => {
    if (!list) {
      res.status(404).end();
      return;
    }
    if (err) {
      // https://expressjs.com/en/guide/error-handling.html
      next(err);
      return;
    }
    res.json(list);
  });
});

// read a file
app.get("/files/:name", (req, res, next) => {
  const fileName = req.params.name;
  fs.readFile(`${FILES_DIR}/${fileName}`, "utf-8", (err, fileText) => {
    if (!fileName) {
      res.status(404).send("Not Found");
      return;
    }
    if (err) {
      res.status(400).send("Bad request");
      return;
    }

    const responseData = {
      name: fileName,
      text: fileText,
    };
    res.json(responseData);
  });
});

// write a file
app.post("/files/:name", (req, res, next) => {
  const fileName = req.params.name;
  const fileText = req.body.text;
  fs.writeFile(`${FILES_DIR}/${fileName}`, fileText, (err) => {
    if (err) {
      res.status(400).send(err);
      return;
    }

    // https://stackoverflow.com/questions/33214717/why-post-redirects-to-get-and-put-redirects-to-put
    res.redirect(303, "/files");
  });
});

// // delete a file
app.delete("/files/:name", (req, res, next) => {
  const fileName = req.params.name;
  console.log(fileName);
  fs.unlink(`${FILES_DIR}/${fileName}`, (err) => {
    if (err && err.code === "ENOENT") {
      res.status(404).send("File not found");
      return;
    }
    if (!fileName) {
      res.status(404).send("File not found");
      return;
    }

    res.redirect(303, "/files");
  });
});

// // - handle errors in the routes and middleware -

// https://expressjs.com/en/guide/error-handling.html
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).end();
});

// - open server -
// try to exactly match the message logged by demo.min.js
app.listen(config.PORT, () => {
  console.log(
    `simple editor: running app on port:${config.PORT} (${config.MODE} mode)`
  );
});
