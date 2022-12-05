import morphdom from "https://unpkg.com/morphdom/dist/morphdom-esm.js";
const ws = new WebSocket(`ws://${location.host}/ws`);

async function update(payload) {
  // update html
  const doc = document.getElementById("viewer").contentWindow.document;
  const root = doc.getElementById("root");
  root && morphdom(root, `<div id="root">${payload.document}</div>`);
  // update curosr position
  let line = payload.line;
  const query = `[data-source-line="${line}"],[id="data-source-line-${line}"]`;
  let element = doc.querySelector(query);
  while (line > 1 && !element) {
    line--;
    element = doc.querySelector(query);
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
