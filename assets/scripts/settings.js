"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

/**
 * Settings script handler.
 */
(function () {
  if ('undefined' === typeof wp) {
    return;
  }

  var __ = wp.i18n.__; // Find settings element.

  var screen = document.getElementById('social-planner-settings'); // Stop if settings element not exists.

  if (null === screen) {
    return;
  }

  if ('undefined' === typeof window.socialPlannerSettings) {
    return;
  }

  var config = window.socialPlannerSettings;
  /**
   * Show warning message.
   *
   * @param {HTMLElement} parent Parent DOM element.
   * @param {string} message Error text message.
   */

  var showWarning = function showWarning(parent, message) {
    var warning = document.createElement('p');
    warning.classList.add('social-planner-warning');
    warning.textContent = message;
    parent.appendChild(warning);
  };
  /**
   * Create provider settings field.
   *
   * @param {HTMLElement} provider Parent DOM element.
   * @param {Object} args Field settings.
   */


  var createField = function createField(provider, args) {
    var field = document.createElement('div');
    field.classList.add('social-planner-field');
    provider.appendChild(field);
    var title = document.createElement('strong');
    title.textContent = args.label;
    field.appendChild(title);
    var input = document.createElement('input');
    input.setAttribute('type', 'text');
    field.appendChild(input);

    if (args.required) {
      input.setAttribute('required', 'required');
    }

    if (args.placeholder) {
      input.setAttribute('placeholder', args.placeholder);
    }

    var hint = document.createElement('small');
    field.appendChild(hint);

    if (args.hint) {
      hint.innerHTML = args.hint;
    }

    return field;
  };
  /**
   * Append provider to form.
   *
   * @param {HTMLElement} parent Form DOM element.
   * @param {Object} args Provider settings object.
   */


  var appendProvider = function appendProvider(parent, args) {
    var provider = document.createElement('div');
    provider.classList.add('social-planner-provider');
    parent.insertBefore(provider, parent.lastChild); // Collapse provider if it exists.

    if (args.data) {
      provider.classList.add('is-collapsed');
    }

    args.data = args.data || {}; // Set form not empty class to show submit button.

    parent.classList.add('is-updated'); // Find label in config by network.

    var label = args.network.label || __('Provider', 'social-planner'); // Create provider heading.


    var heading = document.createElement('div');
    heading.classList.add('social-planner-heading');
    heading.textContent = label + ' ' + __('settings', 'social-planner');
    provider.appendChild(heading); // Create heading explainer.

    var explainer = document.createElement('span');
    heading.appendChild(explainer);

    if (args.data.title) {
      explainer.textContent = ': ' + args.data.title;
    } // Trigger on heading click.


    heading.addEventListener('click', function (e) {
      e.preventDefault();
      provider.classList.toggle('is-collapsed');
    }); // Create helper text.

    var helper = document.createElement('div');
    helper.classList.add('social-planner-helper');

    if (args.network.helper) {
      helper.innerHTML = args.network.helper;
      provider.appendChild(helper);
    }

    if (!config.fields) {
      config.fields = [];
    }

    var fields = args.network.fields || []; // Create fields.

    for (var key in fields) {
      var field = createField(provider, fields[key]); // Find input.

      var input = field.querySelector('input'); // Set input name attribute.

      input.setAttribute('name', args.name + '[' + key + ']');

      if (args.data[key]) {
        input.value = args.data[key];
      }
    } // Create remove button.


    var remove = document.createElement('button');
    remove.classList.add('social-planner-remove');
    remove.setAttribute('type', 'button');
    remove.textContent = __('Delete provider', 'social-planner');
    provider.appendChild(remove); // Trigger on provider remove button click.

    remove.addEventListener('click', function () {
      provider.parentNode.removeChild(provider);
    });
  };
  /**
   * Create and return main providers selector.
   *
   * @param {HTMLElement} parent Form DOM element.
   */


  var createAppend = function createAppend(parent) {
    var append = document.createElement('div');
    append.classList.add('social-planner-append');
    parent.appendChild(append);
    var select = document.createElement('select');
    append.appendChild(select);

    for (var network in config.networks) {
      // Check if label exists.
      if (!config.networks[network].label) {
        continue;
      }

      var option = document.createElement('option');
      option.textContent = config.networks[network].label;
      option.value = network;
      select.appendChild(option);
    }

    var button = document.createElement('button');
    button.classList.add('button');
    button.setAttribute('type', 'button');
    button.textContent = __('Add provider', 'social-planner'); // Trigger on append button click.

    button.addEventListener('click', function () {
      // Generate unique provider index;
      var index = new Date().getTime().toString(16); // Generate name using network and index.

      var name = '[' + select.value + '-' + index + ']';
      appendProvider(parent, {
        name: config.option + name,
        network: config.networks[select.value]
      });
    });
    append.appendChild(button);
  };
  /**
   * Create submit button
   *
   * @param {HTMLElement} parent Form DOM element.
   */


  var createSubmit = function createSubmit(parent) {
    var submit = document.createElement('button');
    submit.classList.add('social-planner-submit', 'button', 'button-primary');
    submit.setAttribute('type', 'submit');
    submit.textContent = __('Save changes', 'social-planner');
    parent.appendChild(submit);
  };
  /**
   * Append settings form initial elements.
   */


  var initProvidersForm = function initProvidersForm() {
    var form = screen.querySelector('.social-planner-providers'); // Check required settings.

    if (!config.option || !config.networks) {
      var message = __('Networks settings are not formatted correctly', 'social-planner');

      return showWarning(form, message);
    }

    config.providers = config.providers || {}; // Add form append.

    createAppend(form); // Add submit form button.

    createSubmit(form);

    for (var key in config.providers) {
      var match = key.match(/(.+)-(\w+)$/) || [];

      if (3 > match.length) {
        continue;
      } // Use destructuring assignment on match.


      var _match = _slicedToArray(match, 3),
          network = _match[1],
          index = _match[2]; // Check if network exists.


      if (!config.networks[network]) {
        continue;
      } // Generate name using network and index.


      var name = '[' + network + '-' + index + ']';
      appendProvider(form, {
        data: config.providers[key],
        name: config.option + name,
        network: config.networks[network]
      });
    }
  };

  initProvidersForm();
})();