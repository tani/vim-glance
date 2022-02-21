const ws = new WebSocket(`ws://${location.host}/ws`);
const win = document.getElementById("viewer").contentWindow;
const doc = win.document;

async function update(payload) {
  // update html
  const root = doc.getElementById("root");
  if (root.innerHTML !== payload.document) {
    root.innerHTML = payload.document;
  }
  // update curosr position
  let line = payload.line;
  let element = doc.querySelector(`[data-source-line="${line}"]`);
  while (line > 1 && !element) {
    line--;
    element = doc.querySelector(`[data-source-line="${line}"]`);
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
