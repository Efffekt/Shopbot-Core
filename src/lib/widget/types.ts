// Widget TypeScript interfaces

export interface WidgetConfig {
  storeId: string;
  accentColor: string;
  textColor: string;
  fontBody: string;
  fontBrand: string;
  brandStyle: "normal" | "italic";
  position: "bottom-right" | "bottom-left";
  greeting: string;
  placeholder: string;
  brandName: string;
  theme: "auto" | "light" | "dark";
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatState {
  isOpen: boolean;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sessionId: string;
}

export interface ThemeColors {
  // Base colors
  bg: string;
  surface: string;
  surfaceHover: string;
  text: string;
  textMuted: string;
  border: string;
  // Accent (customizable)
  accent: string;
  accentHover: string;
  accentText: string;
}
