const assert = (condition) => {
  if (typeof condition !== "boolean") {
    console.error(condition, typeof condition);
    throw new Error("expected boolean");
  }
  if (!condition) {
    throw new Error("assertion error");
  }
};

// returns x in [a, b)
const randint = (a, b) => Math.trunc(Math.random() * (b - a) + a);

const isdigit = (char) => {
  assert(char.length === 1);
  return (
    char.charCodeAt(0) >= "0".charCodeAt(0) &&
    char.charCodeAt(0) <= "9".charCodeAt(0)
  );
};

const isletter = (char) => {
  assert(char.length === 1);
  return (
    (char.charCodeAt(0) >= "a".charCodeAt(0) &&
      char.charCodeAt(0) <= "z".charCodeAt(0)) ||
    (char.charCodeAt(0) >= "A".charCodeAt(0) &&
      char.charCodeAt(0) <= "Z".charCodeAt(0)) ||
    char === "_"
  );
};

const isinteger = (n) => {
  assert(typeof n === "number");
  return n === Math.trunc(n);
};

const select = (selector) => {
  const obj = document.querySelector(selector);
  assert(obj !== null);
  return obj;
};

// the two functions below (saveCaretPosition and getTextNodeAtPosition) are
// from https://stackoverflow.com/a/38479462/6164984
function saveCaretPosition(context) {
  var selection = window.getSelection();
  var range = selection.getRangeAt(0);
  range.setStart(context, 0);
  var len = range.toString().length;

  return function restore() {
    var pos = getTextNodeAtPosition(context, len);
    selection.removeAllRanges();
    var range = new Range();
    range.setStart(pos.node, pos.position);
    selection.addRange(range);
  };
}

function getTextNodeAtPosition(root, index) {
  const NODE_TYPE = NodeFilter.SHOW_TEXT;
  var treeWalker = document.createTreeWalker(root, NODE_TYPE, function next(
    elem
  ) {
    if (index > elem.textContent.length) {
      index -= elem.textContent.length;
      return NodeFilter.FILTER_REJECT;
    }
    return NodeFilter.FILTER_ACCEPT;
  });
  var c = treeWalker.nextNode();
  return {
    node: c ? c : root,
    position: index,
  };
}

class SimpCError extends Error {
  constructor(message) {
    super(message);

    this.name = "SimpCError";
  }
}
