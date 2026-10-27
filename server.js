// the server holds the one true face.
// nobody owns it. every tab is just looking at the same face and pulling on it.

let express = require("express");
let http = require("http");
let { Server } = require("socket.io");

let app = express();
let server = http.createServer(app);
let io = new Server(server);

// serve everything in /public (html, css, js, and the face parts)
app.use(express.static("public"));

// the parts library. these are the exact png names in public/parts.
// to add a new drawing, export it from aseprite into that folder and add its name here.
let parts = {
  brows: ["BROW04", "BROW01", "BROW02", "BROW03"],
  eyes: ["EYE", "EYE02", "EYE03", "EYE04"],
  mouth: ["MOUTH", "MOUTH02", "MOUTH03", "MOUTH04"]
};

// the clickable regions, and which parts list each one draws from.
// brows and eyes are split in two, so each side of the face moves on its own.
// left and right mean as you look at the screen.
let regions = {
  browLeft: "brows",
  browRight: "brows",
  eyeLeft: "eyes",
  eyeRight: "eyes",
  mouth: "mouth"
};

// the face everyone starts on: first part of each list, both sides matching
let face = {
  browLeft: parts.brows[0],
  browRight: parts.brows[0],
  eyeLeft: parts.eyes[0],
  eyeRight: parts.eyes[0],
  mouth: parts.mouth[0]
};

io.on("connection", (socket) => {
  console.log("someone arrived:", socket.id);

  // server emit #1: hand the newcomer the current face, just to them
  socket.emit("setup", { face: face });

  // a client clicked a region and wants it to move to its next state
  socket.on("cycle", (data) => {
    let region = data.region;

    // ignore anything that isn't a real region (someone poking at the console)
    if (!regions[region]) return;

    // find where this region currently is in its list, step forward, wrap around
    let list = parts[regions[region]];
    let index = list.indexOf(face[region]);
    face[region] = list[(index + 1) % list.length];

    // server emit #2: send the new face to every tab, including the one that clicked.
    // we also say which region moved, so the client can flash it.
    io.emit("face", { face: face, changed: region });
  });

  socket.on("disconnect", () => {
    console.log("someone left:", socket.id);
  });
});

// railway hands us a PORT. locally we fall back to 3000.
let port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log("face is awake on port " + port);
});
