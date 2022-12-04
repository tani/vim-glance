import morphdom from "https://unpkg.com/morphdom/dist/morphdom-esm.js";
const ws = new WebSocket(`ws://${location.host}/ws`);
let html = "";

async function update(payload) {
  //console.log(payload);
  const doc = document.getElementById("viewer").contentWindow.document;
  // update html
  const root = doc.getElementById("root");
  if (root) {
    morphdom(root, `<div id="root">${payload.document}</div>`);
  }
  // update curosr position
  let line = payload.line;
  let element = doc.querySelector(`[data-source-line="${line}"],[id="data-source-line-${line}"]`);
  while (line > 1 && !element) {
    line--;
    element = doc.querySelector(`[data-source-line="${line}"],[id="data-source-line-${line}"]`);
  }
  element?.scrollIntoView();
}

ws.addEventListener("message", (event) => {
  const { type, payload } = JSON.parse(event.data);
  switch (type) {
    case "update":
      update(payload);
      break;
  }
});

window.addEventListener("unload", () => {
  ws.close();
});
