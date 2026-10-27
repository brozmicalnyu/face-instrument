// connect to the server that holds the shared face
let socket = io();

// grab the five feature layers. the ids match the region names the server uses.
let layers = {
  browLeft: document.getElementById("browLeft"),
  browRight: document.getElementById("browRight"),
  eyeLeft: document.getElementById("eyeLeft"),
  eyeRight: document.getElementById("eyeRight"),
  mouth: document.getElementById("mouth")
};

// client emit: clicking a feature asks the server to move it to its next drawing.
// we don't change the picture here. we wait for the server to tell everyone,
// so every tab (including this one) changes at the same moment.
let zones = document.querySelectorAll(".zone");
zones.forEach((zone) => {
  zone.addEventListener("click", () => {
    socket.emit("cycle", { region: zone.dataset.region });
  });
});

// first contact: the server sends the current face
socket.on("setup", (data) => {
  markFace(data.face, null);
});

// someone (maybe us, maybe the other tab) changed the face
socket.on("face", (data) => {
  markFace(data.face, data.changed);
});

// put the right pngs on the face
function markFace(face, changed) {
  for (let region in layers) {
    layers[region].src = "parts/" + face[region] + ".png";
  }

  // blink the feature that just moved, same idea as a key being struck on an instrument
  if (changed) {
    let layer = layers[changed];
    layer.classList.remove("flash");
    void layer.offsetWidth; // forces the browser to restart the animation
    layer.classList.add("flash");
  }
}
