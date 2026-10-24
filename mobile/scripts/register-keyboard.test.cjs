const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/app/(auth)/register.jsx'), 'utf8');
const code = ts.transpileModule(source, {
  compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS },
}).outputText;

// Native layout is mocked; these checks cover the screen's event and scroll-lock behavior.
function mount() {
  const hooks = [];
  const effects = [];
  const cleanups = [];
  const listeners = new Map();
  const scrolls = [];
  let cursor = 0;
  let tree;
  let focused = null;
  let visible = false;
  const react = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    useRef(value) {
      const index = cursor++;
      return hooks[index] ??= { current: value };
    },
    useState(value) {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = typeof value === 'function' ? value() : value;
      return [hooks[index], next => { hooks[index] = typeof next === 'function' ? next(hooks[index]) : next; }];
    },
    useCallback(callback) {
      const index = cursor++;
      return hooks[index] ??= callback;
    },
    useEffect(effect) {
      const index = cursor++;
      if (!(index in hooks)) {
        hooks[index] = true;
        effects.push(effect);
      }
    },
  };
  function TextInput() {}
  TextInput.State = { currentlyFocusedInput: () => focused };
  const native = {
    Keyboard: new class {
      get _currentlyShowing() { return visible; }
      isVisible() { return !!this._currentlyShowing; }
      dismiss() { keyboard(false); }
      addListener(name, callback) {
        listeners.set(name, callback);
        return { remove: () => listeners.delete(name) };
      }
    },
    KeyboardAvoidingView: 'KeyboardAvoidingView', Pressable: 'Pressable',
    ScrollView: 'ScrollView', Text: 'Text', TextInput, View: 'View',
    useWindowDimensions: () => ({ fontScale: 1 }),
  };
  const modules = {
    react, 'react-native': native,
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    'expo-router': { router: { navigate() {} } },
    'lucide-react-native': { Eye: 'Eye', EyeOff: 'EyeOff', Lock: 'Lock', Mail: 'Mail', User: 'User' },
    '@/lib/theme': { THEME: {} },
    '@/lib/auth': { validateRegister: () => ({ password: 'Use a longer password.' }) },
  };
  const context = { exports: {}, React: react, require: name => {
    assert(name in modules, `Unexpected import: ${name}`);
    return modules[name];
  } };
  vm.runInNewContext(code, context);
  function nodes(node = tree) {
    if (!node || typeof node !== 'object') return [];
    return [node, ...(node.props?.children ?? []).flat(Infinity).flatMap(child => nodes(child))];
  }
  function render() {
    cursor = 0;
    tree = context.exports.default();
    for (const node of nodes()) {
      if (node.props.ref && !node.props.ref.current) {
        node.props.ref.current = node.type === 'ScrollView'
          ? { scrollResponderScrollNativeHandleToKeyboard: (...args) => scrolls.push(args) }
          : { focus: () => focus(node.props.accessibilityLabelledBy) };
      }
    }
    for (const effect of effects.splice(0)) cleanups.push(effect());
  }
  function input(label) {
    return nodes().find(node => node.type === TextInput && node.props.accessibilityLabelledBy === label);
  }
  function focus(label) {
    nodes().find(node => node.props.ref?.current === focused)?.props.onBlur?.();
    const node = input(label);
    focused = node.props.ref.current;
    node.props.onFocus?.();
    render();
  }
  function keyboard(show) {
    visible = show;
    listeners.get(show ? 'keyboardDidShow' : 'keyboardDidHide')?.();
    render();
  }
  render();
  return {
    focus, keyboard, input, scrolls, listeners,
    scroll: () => nodes().find(node => node.type === 'ScrollView'),
    section: () => nodes().find(node => node.type === 'View' &&
      nodes(node).some(child => child.props.nativeID === 'password-label') && node.props.ref),
    press(label) {
      nodes().find(node => node.type === 'Pressable' &&
        node.props.accessibilityLabel === label).props.onPress();
      render();
    },
    submit() { input('password-label').props.onSubmitEditing(); render(); },
    unmount() { cleanups.forEach(cleanup => cleanup?.()); },
  };
}

test('password locks scrolling after keyboard show, and unlocks on hide and reopen', () => {
  const screen = mount();
  screen.focus('password-label');
  assert.notEqual(screen.scroll().props.scrollEnabled, false);
  screen.keyboard(true);
  assert.equal(screen.scroll().props.scrollEnabled, false);
  assert.equal(screen.scrolls.at(-1)[0], screen.section().props.ref.current);
  screen.keyboard(false);
  assert.notEqual(screen.scroll().props.scrollEnabled, false);
  screen.keyboard(true);
  assert.equal(screen.scroll().props.scrollEnabled, false);
});

test('Email Next focuses password and locks; changing field releases the lock', () => {
  const screen = mount();
  screen.focus('email-label');
  screen.keyboard(true);
  assert.notEqual(screen.scroll().props.scrollEnabled, false);
  screen.input('email-label').props.onSubmitEditing();
  assert.equal(screen.scroll().props.scrollEnabled, false);
  screen.focus('full-name-label');
  assert.notEqual(screen.scroll().props.scrollEnabled, false);
});

test('visibility toggle and error/layout changes keep password section positioned and locked', () => {
  const screen = mount();
  screen.focus('password-label');
  screen.keyboard(true);
  screen.press('Show password');
  assert.equal(screen.input('password-label').props.secureTextEntry, false);
  assert.equal(screen.scroll().props.scrollEnabled, false);
  screen.submit();
  assert.match(screen.input('password-label').props.accessibilityLabel, /longer password/);
  const before = screen.scrolls.length;
  screen.scroll().props.onLayout();
  screen.scroll().props.onContentSizeChange();
  screen.section().props.onLayout();
  assert.equal(screen.scrolls.length, before + 3);
  assert.equal(screen.scrolls.at(-1)[0], screen.section().props.ref.current);
  assert.equal(screen.scroll().props.scrollEnabled, false);
});

test('keyboard listeners are removed on unmount and no unsupported event prop remains', () => {
  const screen = mount();
  assert.equal(screen.scroll().props.onKeyboardDidShow, undefined);
  assert.equal(screen.listeners.size, 2);
  screen.unmount();
  assert.equal(screen.listeners.size, 0);
});
