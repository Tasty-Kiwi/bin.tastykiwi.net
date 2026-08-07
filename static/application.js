/* global hljs, window, document, fetch */

function query(selector, parent) {
  return (parent || document).querySelector(selector);
}

function queryAll(selector, parent) {
  return Array.prototype.slice.call((parent || document).querySelectorAll(selector));
}

function setHidden(element, hidden) {
  element.hidden = hidden;
}

function readJsonResponse(response) {
  return response.json().then(function(data) {
    if (!response.ok) {
      var error = new Error(data.message || 'Request failed.');
      error.data = data;
      throw error;
    }
    return data;
  });
}

function onReady(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

///// represents a single document

var haste_document = function() {
  this.locked = false;
};

// Escapes HTML tag characters
haste_document.prototype.htmlEscape = function(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/>/g, '&gt;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
};

// Get this document from the server and lock it here
haste_document.prototype.load = function(key, callback, lang) {
  var _this = this;
  fetch('/documents/' + encodeURIComponent(key), {
    headers: { Accept: 'application/json' }
  })
    .then(readJsonResponse)
    .then(function(res) {
      _this.locked = true;
      _this.key = key;
      _this.data = res.data;
      try {
        var high;
        if (lang === 'txt') {
          high = { value: _this.htmlEscape(res.data) };
        }
        else if (lang) {
          high = hljs.highlight(lang, res.data);
        }
        else {
          high = hljs.highlightAuto(res.data);
        }
      } catch(err) {
        // failed highlight, fall back on auto
        high = hljs.highlightAuto(res.data);
      }
      callback({
        value: high.value,
        key: key,
        language: high.language || lang,
        lineCount: res.data.split('\n').length
      });
    })
    .catch(function() {
      callback(false);
    });
};

// Save this document to the server and lock it here
haste_document.prototype.save = function(data, callback) {
  if (this.locked) {
    return false;
  }
  this.data = data;
  var _this = this;
  fetch('/documents', {
    method: 'POST',
    body: data,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
    .then(readJsonResponse)
    .then(function(res) {
      _this.locked = true;
      _this.key = res.key;
      var high = hljs.highlightAuto(data);
      callback(null, {
        value: high.value,
        key: res.key,
        language: high.language,
        lineCount: data.split('\n').length
      });
    })
    .catch(function(error) {
      callback(error.data || { message: 'Something went wrong!' });
    });
};

///// represents the paste application

var haste = function(appName, options) {
  this.appName = appName;
  this.textarea = query('textarea');
  this.box = query('#box');
  this.code = query('#box code');
  this.linenos = query('#linenos');
  this.options = options;
  this.configureShortcuts();
  this.configureButtons();
  // If twitter is disabled, hide the button
  if (!options.twitter) {
    setHidden(query('#box2 .twitter'), true);
  }
};

// Set the page title - include the appName
haste.prototype.setTitle = function(ext) {
  var title = ext ? this.appName + ' - ' + ext : this.appName;
  document.title = title;
};

// Show a message box
haste.prototype.showMessage = function(msg, cls) {
  var msgBox = document.createElement('li');
  msgBox.className = cls || 'info';
  msgBox.textContent = msg;
  query('#messages').prepend(msgBox);
  setTimeout(function() {
    msgBox.classList.add('closing');
    setTimeout(function() { msgBox.remove(); }, 200);
  }, 3000);
};

// Show the light key
haste.prototype.lightKey = function() {
  this.configureKey(['new', 'save']);
};

// Show the full key
haste.prototype.fullKey = function() {
  this.configureKey(['new', 'duplicate', 'twitter', 'raw']);
};

// Set the key up for certain things to be enabled
haste.prototype.configureKey = function(enable) {
  queryAll('#box2 .function').forEach(function(button) {
    var i = 0;
    for (i = 0; i < enable.length; i++) {
      if (button.classList.contains(enable[i])) {
        button.classList.add('enabled');
        return true;
      }
    }
    button.classList.remove('enabled');
  });
};

// Remove the current document (if there is one)
// and set up for a new one
haste.prototype.newDocument = function(hideHistory) {
  setHidden(this.box, true);
  this.doc = new haste_document();
  if (!hideHistory) {
    window.history.pushState(null, this.appName, '/');
  }
  this.setTitle();
  this.lightKey();
  this.textarea.value = '';
  setHidden(this.textarea, false);
  this.textarea.focus();
  this.removeLineNumbers();
};

// Map of common extensions
// Note: this list does not need to include anything that IS its extension,
// due to the behavior of lookupTypeByExtension and lookupExtensionByType
// Note: optimized for lookupTypeByExtension
haste.extensionMap = {
  rb: 'ruby', py: 'python', pl: 'perl', php: 'php', scala: 'scala', go: 'go',
  xml: 'xml', html: 'xml', htm: 'xml', css: 'css', js: 'javascript', vbs: 'vbscript',
  lua: 'lua', pas: 'delphi', java: 'java', cpp: 'cpp', cc: 'cpp', m: 'objectivec',
  vala: 'vala', sql: 'sql', sm: 'smalltalk', lisp: 'lisp', ini: 'ini',
  diff: 'diff', bash: 'bash', sh: 'bash', tex: 'tex', erl: 'erlang', hs: 'haskell',
  md: 'markdown', txt: '', coffee: 'coffee', swift: 'swift'
};

// Look up the extension preferred for a type
// If not found, return the type itself - which we'll place as the extension
haste.prototype.lookupExtensionByType = function(type) {
  for (var key in haste.extensionMap) {
    if (haste.extensionMap[key] === type) return key;
  }
  return type;
};

// Look up the type for a given extension
// If not found, return the extension - which we'll attempt to use as the type
haste.prototype.lookupTypeByExtension = function(ext) {
  return haste.extensionMap[ext] || ext;
};

// Add line numbers to the document
// For the specified number of lines
haste.prototype.addLineNumbers = function(lineCount) {
  var h = '';
  for (var i = 0; i < lineCount; i++) {
    h += (i + 1).toString() + '<br/>';
  }
  this.linenos.innerHTML = h;
};

// Remove the line numbers
haste.prototype.removeLineNumbers = function() {
  this.linenos.innerHTML = '&gt;';
};

// Load a document and show it
haste.prototype.loadDocument = function(key) {
  // Split the key up
  var parts = key.split('.', 2);
  // Ask for what we want
  var _this = this;
  _this.doc = new haste_document();
  _this.doc.load(parts[0], function(ret) {
    if (ret) {
      _this.code.innerHTML = ret.value;
      _this.setTitle(ret.key);
      _this.fullKey();
      _this.textarea.value = '';
      setHidden(_this.textarea, true);
      setHidden(_this.box, false);
      _this.box.focus();
      _this.addLineNumbers(ret.lineCount);
    }
    else {
      _this.newDocument();
    }
  }, this.lookupTypeByExtension(parts[1]));
};

// Duplicate the current document - only if locked
haste.prototype.duplicateDocument = function() {
  if (this.doc.locked) {
    var currentData = this.doc.data;
    this.newDocument();
    this.textarea.value = currentData;
  }
};

// Lock the current document
haste.prototype.lockDocument = function() {
  var _this = this;
  this.doc.save(this.textarea.value, function(err, ret) {
    if (err) {
      _this.showMessage(err.message, 'error');
    }
    else if (ret) {
      _this.code.innerHTML = ret.value;
      _this.setTitle(ret.key);
      var file = '/' + ret.key;
      if (ret.language) {
        file += '.' + _this.lookupExtensionByType(ret.language);
      }
      window.history.pushState(null, _this.appName + '-' + ret.key, file);
      _this.fullKey();
      _this.textarea.value = '';
      setHidden(_this.textarea, true);
      setHidden(_this.box, false);
      _this.box.focus();
      _this.addLineNumbers(ret.lineCount);
    }
  });
};

haste.prototype.configureButtons = function() {
  var _this = this;
  this.buttons = [
    {
      where: query('#box2 .save'),
      label: 'Save',
      shortcutDescription: 'control + s',
      shortcut: function(evt) {
        return evt.ctrlKey && evt.key.toLowerCase() === 's';
      },
      action: function() {
        if (_this.textarea.value.replace(/^\s+|\s+$/g, '') !== '') {
          _this.lockDocument();
        }
      }
    },
    {
      where: query('#box2 .new'),
      label: 'New',
      shortcut: function(evt) {
        return evt.ctrlKey && evt.key.toLowerCase() === 'n';
      },
      shortcutDescription: 'control + n',
      action: function() {
        _this.newDocument(!_this.doc.key);
      }
    },
    {
      where: query('#box2 .duplicate'),
      label: 'Duplicate & Edit',
      shortcut: function(evt) {
        return _this.doc.locked && evt.ctrlKey && evt.key.toLowerCase() === 'd';
      },
      shortcutDescription: 'control + d',
      action: function() {
        _this.duplicateDocument();
      }
    },
    {
      where: query('#box2 .raw'),
      label: 'Just Text',
      shortcut: function(evt) {
        return evt.ctrlKey && evt.shiftKey && evt.key.toLowerCase() === 'r';
      },
      shortcutDescription: 'control + shift + r',
      action: function() {
        window.location.href = '/raw/' + _this.doc.key;
      }
    },
    {
      where: query('#box2 .twitter'),
      label: 'Twitter',
      shortcut: function(evt) {
        return _this.options.twitter && _this.doc.locked && evt.shiftKey && evt.ctrlKey && evt.key.toLowerCase() === 't';
      },
      shortcutDescription: 'control + shift + t',
      action: function() {
        window.open('https://twitter.com/share?url=' + encodeURI(window.location.href));
      }
    }
  ];
  for (var i = 0; i < this.buttons.length; i++) {
    this.configureButton(this.buttons[i]);
  }
};

haste.prototype.configureButton = function(options) {
  // Handle the click action
  options.where.addEventListener('click', function(evt) {
    evt.preventDefault();
    if (!options.clickDisabled && this.classList.contains('enabled')) {
      options.action();
    }
  });
  // Show the label
  options.where.addEventListener('mouseenter', function() {
    query('#box3 .label').textContent = options.label;
    query('#box3 .shortcut').textContent = options.shortcutDescription || '';
    setHidden(query('#box3'), false);
    this.appendChild(query('#pointer'));
    setHidden(query('#pointer'), false);
  });
  // Hide the label
  options.where.addEventListener('mouseleave', function() {
    setHidden(query('#box3'), true);
    setHidden(query('#pointer'), true);
  });
};

// Configure keyboard shortcuts for the textarea
haste.prototype.configureShortcuts = function() {
  var _this = this;
  document.body.addEventListener('keydown', function(evt) {
    var button;
    for (var i = 0 ; i < _this.buttons.length; i++) {
      button = _this.buttons[i];
      if (button.shortcut && button.shortcut(evt)) {
        evt.preventDefault();
        button.action();
        return;
      }
    }
  });
};

///// Tab behavior in the textarea - 2 spaces per tab
onReady(function() {
  query('textarea').addEventListener('keydown', function(evt) {
    if (evt.keyCode === 9) {
      evt.preventDefault();
      var myValue = '  ';
      if (typeof this.selectionStart === 'number') {
        var startPos = this.selectionStart;
        var endPos = this.selectionEnd;
        var scrollTop = this.scrollTop;
        this.value = this.value.substring(0, startPos) + myValue +
          this.value.substring(endPos,this.value.length);
        this.focus();
        this.selectionStart = startPos + myValue.length;
        this.selectionEnd = startPos + myValue.length;
        this.scrollTop = scrollTop;
      }
      else {
        this.value += myValue;
        this.focus();
      }
    }
  });
});
