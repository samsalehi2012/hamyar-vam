/*
 * همیار وام — رانتایم سبک پروتوتایپ
 * قالب‌های {{...}}، <sc-if> و <sc-for> را از <template id="hv-tpl"> می‌خواند،
 * با کلاس Component (extends DCLogic) رندر می‌کند و با morphdom به‌روز می‌کند.
 */
(function () {
  'use strict';

  var WHOLE = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;
  var ANY = /\{\{\s*([^}]+?)\s*\}\}/g;
  var BOOL_ATTRS = { disabled: 1, selected: 1, readonly: 1, required: 1, hidden: 1 };

  var handlers = [];
  var inst = null;
  var tpl = null;
  var root = null;
  var queued = false;

  function DCLogic(props) {
    this.props = props || {};
    this.state = null;
  }
  DCLogic.prototype.setState = function (patch) {
    var next = typeof patch === 'function' ? patch(this.state || {}, this.props) : patch;
    this.state = Object.assign({}, this.state || {}, next || {});
    schedule();
  };
  DCLogic.prototype.forceUpdate = function () { schedule(); };
  window.DCLogic = DCLogic;

  function lookup(path, scope) {
    path = String(path).trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    if (path === 'undefined') return undefined;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    if (/^(['"]).*\1$/.test(path)) return path.slice(1, -1);
    var parts = path.split('.');
    var v = scope;
    for (var i = 0; i < parts.length; i++) {
      if (v == null) return undefined;
      v = v[parts[i]];
    }
    return v;
  }

  function interp(str, scope) {
    return str.replace(ANY, function (_, p) {
      var v = lookup(p, scope);
      return v == null ? '' : String(v);
    });
  }

  function fixHref(v) {
    return typeof v === 'string' ? v.replace(/\.dc\.html(?=$|[?#])/, '.html') : v;
  }

  function renderNode(node, scope, out) {
    if (node.nodeType === 3) {
      out.push(document.createTextNode(interp(node.nodeValue, scope)));
      return;
    }
    if (node.nodeType !== 1) return;
    var tag = node.localName;
    var i, m;

    if (tag === 'sc-for') {
      m = (node.getAttribute('list') || '').match(WHOLE);
      var list = m ? lookup(m[1], scope) : null;
      var as = node.getAttribute('as') || 'item';
      if (Array.isArray(list)) {
        list.forEach(function (item, idx) {
          var s = Object.create(scope);
          s[as] = item;
          s.$index = idx;
          for (var c = 0; c < node.childNodes.length; c++) renderNode(node.childNodes[c], s, out);
        });
      }
      return;
    }
    if (tag === 'sc-if') {
      m = (node.getAttribute('value') || '').match(WHOLE);
      if (m && lookup(m[1], scope)) {
        for (i = 0; i < node.childNodes.length; i++) renderNode(node.childNodes[i], scope, out);
      }
      return;
    }

    var el = document.createElementNS(node.namespaceURI, node.localName);
    var type = (node.getAttribute('type') || '').toLowerCase();
    var pendingValue = null;
    var pendingChecked = null;

    for (i = 0; i < node.attributes.length; i++) {
      var a = node.attributes[i];
      var name = a.name;
      var raw = a.value;
      if (name.indexOf('hint-') === 0) continue;
      m = raw.match(WHOLE);

      if (name.indexOf('on') === 0 && m) {
        var fn = lookup(m[1], scope);
        if (typeof fn === 'function') {
          var ev = name.slice(2);
          if (ev === 'change') {
            ev = (node.localName === 'select' || type === 'checkbox' || type === 'radio') ? 'change' : 'input';
          }
          el.setAttribute('data-hv-' + ev, String(handlers.length));
          handlers.push(fn);
        }
        continue;
      }

      var v = m ? lookup(m[1], scope) : (raw.indexOf('{{') >= 0 ? interp(raw, scope) : raw);

      if (name === 'checked') { pendingChecked = !!(v && v !== 'false'); continue; }
      if (name === 'value') { pendingValue = v == null ? '' : String(v); continue; }
      if (BOOL_ATTRS[name]) {
        if (v === '' || (v && v !== 'false')) el.setAttribute(name, '');
        continue;
      }
      if (name.indexOf('aria-') === 0 && typeof v === 'boolean') { el.setAttribute(name, String(v)); continue; }
      if (v === false || v == null) continue;
      if (v === true) v = '';
      if (name === 'href') v = fixHref(v);
      el.setAttribute(name, String(v));
    }

    if (pendingValue !== null) { el.setAttribute('value', pendingValue); el.value = pendingValue; }
    if (pendingChecked !== null) { if (pendingChecked) el.setAttribute('checked', ''); el.checked = pendingChecked; }

    var kids = [];
    for (i = 0; i < node.childNodes.length; i++) renderNode(node.childNodes[i], scope, kids);
    for (i = 0; i < kids.length; i++) el.appendChild(kids[i]);
    out.push(el);
  }

  function render() {
    queued = false;
    handlers = [];
    var vals = inst.renderVals() || {};
    var scope = Object.assign(Object.create(null), vals);
    var out = [];
    var src = tpl.content.childNodes;
    for (var i = 0; i < src.length; i++) renderNode(src[i], scope, out);
    var next = document.createElement('div');
    for (var j = 0; j < out.length; j++) next.appendChild(out[j]);
    if (!root.firstChild) {
      while (next.firstChild) root.appendChild(next.firstChild);
    } else {
      window.morphdom(root, next, { childrenOnly: true });
    }
  }

  function schedule() {
    if (queued) return;
    queued = true;
    Promise.resolve().then(render);
  }

  function dispatch(evName) {
    document.addEventListener(evName, function (e) {
      var t = e.target;
      while (t && t !== document) {
        if (t.nodeType === 1 && t.hasAttribute('data-hv-' + evName)) {
          var fn = handlers[+t.getAttribute('data-hv-' + evName)];
          if (fn) fn(e);
          return;
        }
        t = t.parentNode;
      }
      if (evName === 'click') fallbackClick(e);
    });
  }

  /* دکمه‌هایی که در پروتوتایپ کاری ندارند: پیام کوتاه، و «برایم بخوان» با صدای مرورگر اگر صدای فارسی باشد */
  var toastTimer = null;
  function toast(msg) {
    var t = document.getElementById('hv-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'hv-toast';
      t.setAttribute('role', 'status');
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className = 'hv-toast-on';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = ''; }, 2600);
  }

  function speak() {
    var synth = window.speechSynthesis;
    var voices = synth ? synth.getVoices() : [];
    var fa = voices.filter(function (v) { return /^fa/i.test(v.lang); })[0];
    if (!synth || !fa) {
      toast('در نسخه نهایی، متن این صفحه با صدا برایتان خوانده می‌شود.');
      return;
    }
    if (synth.speaking) { synth.cancel(); return; }
    var main = document.querySelector('#hv-app main') || document.getElementById('hv-app');
    var u = new SpeechSynthesisUtterance(main.innerText.replace(/\s+/g, ' ').slice(0, 1200));
    u.voice = fa;
    u.lang = fa.lang;
    synth.speak(u);
  }

  function fallbackClick(e) {
    var b = e.target.closest ? e.target.closest('button') : null;
    if (!b || b.disabled || b.closest('a')) return;
    var text = b.textContent || '';
    if (text.indexOf('برایم بخوان') >= 0) { speak(); return; }
    if (text.indexOf('تماس') >= 0 || (b.getAttribute('aria-label') || '').indexOf('تماس') >= 0) {
      toast('در نسخه نهایی، اینجا مستقیم با کارشناس تماس گرفته می‌شود.');
      return;
    }
    toast('این دکمه در نسخه نهایی فعال می‌شود.');
  }

  function readProps(defs) {
    var props = {};
    var q = new URLSearchParams(location.search);
    Object.keys(defs || {}).forEach(function (k) {
      if (k.charAt(0) === '$') return;
      var d = defs[k] || {};
      if ('default' in d) props[k] = d.default;
      if (q.has(k)) {
        var s = q.get(k);
        props[k] = s === 'true' ? true : s === 'false' ? false : (/^-?\d+(\.\d+)?$/.test(s) ? Number(s) : s);
      }
    });
    return props;
  }

  window.HV = {
    mount: function (Comp, defs) {
      tpl = document.getElementById('hv-tpl');
      root = document.getElementById('hv-app');
      inst = new Comp(readProps(defs));
      if (!inst.props) inst.props = readProps(defs);
      ['click', 'input', 'change'].forEach(dispatch);
      render();
      if (typeof inst.componentDidMount === 'function') inst.componentDidMount();
      if (window.speechSynthesis) window.speechSynthesis.getVoices();
    }
  };
})();
