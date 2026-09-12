import React, { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Colors } from '../constants/theme';

/** Breathing room left between the focused field and the top of the keyboard. */
const FOCUS_GAP = 28;

interface Measurable {
  measureInWindow: (cb: (x: number, y: number, width: number, height: number) => void) => void;
}

interface KeyboardAwareValue {
  /** Called by AppTextField when a field gains focus, so the screen can
   *  scroll it clear of the keyboard. */
  notifyFocus: () => void;
}

const KeyboardAwareContext = createContext<KeyboardAwareValue | null>(null);

/** Opt-in hook for input components — a no-op outside a KeyboardAwareScreen. */
export function useKeyboardAware(): KeyboardAwareValue {
  return useContext(KeyboardAwareContext) ?? { notifyFocus: () => undefined };
}

interface Props {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
}

/**
 * Scrolling screen wrapper that keeps the focused text field above the
 * keyboard instead of behind it.
 *
 * A plain KeyboardAvoidingView + ScrollView is not enough on Android: the
 * window does resize, but nothing scrolls the focused field into the part
 * that's still visible, so a field near the bottom (password on Login, the
 * later fields on Complete Profile) stays hidden underneath the keyboard.
 *
 * So this measures the focused input against the visible bottom edge and
 * scrolls by exactly the overlap. Both the keyboard event and an explicit
 * focus notification from AppTextField trigger it — the keyboard only fires
 * an event when it first opens, so moving between fields while it's already
 * up has to be driven by focus instead.
 */
export default function KeyboardAwareScreen({
  children,
  contentContainerStyle,
  backgroundColor = Colors.background,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollOffset = useRef(0);
  const keyboardHeight = useRef(0);
  const [, setKeyboardShown] = useState(false);

  const scrollFocusedIntoView = () => {
    // A ScrollView instance does expose measureInWindow at runtime (it is a
    // host component underneath), but its public type doesn't declare it.
    const scroll = scrollRef.current as (ScrollView & Measurable) | null;
    const input = TextInput.State.currentlyFocusedInput() as Measurable | null;
    if (!scroll || !input?.measureInWindow) return;

    scroll.measureInWindow((_sx: number, sy: number, _sw: number, sh: number) => {
      input.measureInWindow((_ix: number, iy: number, _iw: number, ih: number) => {
        // Whichever is higher: the bottom of the scroll view (Android resizes
        // the window, so this already excludes the keyboard) or the top of the
        // keyboard (iOS overlays it, so the scroll view still runs underneath).
        const screenHeight = Dimensions.get('window').height;
        const visibleBottom = Math.min(sy + sh, screenHeight - keyboardHeight.current);
        const overlap = iy + ih + FOCUS_GAP - visibleBottom;
        if (overlap > 0) {
          scroll.scrollTo({ y: Math.max(0, scrollOffset.current + overlap), animated: true });
        }
      });
    });
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      keyboardHeight.current = e.endCoordinates?.height ?? 0;
      setKeyboardShown(true);
      // One frame of delay so the resize has landed before measuring.
      setTimeout(scrollFocusedIntoView, 60);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardHeight.current = 0;
      setKeyboardShown(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const value: KeyboardAwareValue = {
    notifyFocus: () => setTimeout(scrollFocusedIntoView, 80),
  };

  return (
    <KeyboardAwareContext.Provider value={value}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={contentContainerStyle}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          scrollEventThrottle={16}
          onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
            scrollOffset.current = e.nativeEvent.contentOffset.y;
          }}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </KeyboardAwareContext.Provider>
  );
}
