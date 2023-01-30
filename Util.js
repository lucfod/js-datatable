var Util = {
  CreateElement: function (a, b) {
    var c = document,
      d = c.createElement(a);
    if (b && "object" == typeof b) {
      var e;
      for (e in b) {
        if (b[e] != "") {
          if (e === "html") {
            d.innerHTML = b[e];
          } else if (e === "text") {
            d.appendChild(c.createTextNode(b[e]));
          } else {
            d.setAttribute(e, b[e]);
          }
        }
      }
    }
    return d;
  },

  CreateFragment: function () {
    return document.createDocumentFragment();
  },

  Extend: function (src, props) {
    var p;
    for (p in props) if (props.hasOwnProperty(p)) src[p] = props[p];
    return src;
  },

  Each: function (a, b, c) {
    if ("[object Object]" === Object.prototype.toString.call(a)) {
      for (var d in a) {
        if (Object.prototype.hasOwnProperty.call(a, d)) {
          b.call(c, d, a[d], a);
        }
      }
    } else {
      for (var e = 0, f = a.length; e < f; e++) {
        b.call(c, e, a[e], a);
      }
    }
  },

  HasClass: function (a, b) {
    return a.classList
      ? a.classList.contains(b)
      : !!a.className &&
          !!a.className.match(new RegExp("(\\s|^)" + b + "(\\s|$)"));
  },

  AddClass: function (a, b) {
    if (b != "") {
      var c = b.split(" ");
      for (var i in c) {
        if (!this.HasClass(a, c[i])) {
          if (a.classList) {
            a.classList.add(c[i]);
          } else {
            a.className = a.className.trim() + " " + c[i];
          }
        }
      }
    }
  },

  RemoveClass: function (a, b) {
    if (this.HasClass(a, b)) {
      if (a.classList) {
        a.classList.remove(b);
      } else {
        a.className = a.className.replace(
          new RegExp("(^|\\s)" + b.split(" ").join("|") + "(\\s|$)", "gi"),
          " "
        );
      }
    }
  },

  ReplaceClass: function (a, b) {
    if (b != "") {
      a.className = b;
    }
  },

  Append: function (p, e) {
    return p && e && p.appendChild(e);
  },

  Listen: function (e, type, callback, scope) {
    if (e.addEventListener) {
      // DOM standard
      e.addEventListener(
        type,
        function (e) {
          callback.call(scope || this, e);
        },
        false
      );
    } else if (e.attachEvent) {
      // IE
      e.attachEvent(type, function (e) {
        callback.call(scope || this, e);
      });
    }
  },

  PreventDefault: function (e) {
    e = e || window.event;
    if (e.preventDefault) {
      return e.preventDefault();
    }
  },

  Includes: function (a, b) {
    return a.indexOf(b) > -1;
  },

  IncludesObject: function (a, b, c) {
    //a = array, b = property, c = search item
    return this.ArrayObjectIndexOf(a, b, c) > -1;
  },

  ArrayObjectIndexOf: function (a, b, c) {
    //a = array, b = property, c = search item
    for (var i = 0; i < a.length; i++) {
      if (a[i][b] === c) return i;
    }
    return -1;
  },

  Flush: function (el, ie) {
    if (ie) {
      while (el.hasChildNodes()) {
        el.removeChild(el.firstChild);
      }
    } else {
      el.innerHTML = "";
    }
  },
};
