import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const SUPPORTED_LANGUAGES = ["en", "ko", "ja", "zh", "es", "vi", "ru", "fr", "ar"] as const;
export type WorkspaceLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const resources = {
  en: {
    translation: {
      workspace: {
        title: "Data Workspace",
        variablePanel: "Global variables",
        noVariable: "No variables detected"
      },
      sidebar: {
        settings: "Settings",
        plugins: "Plugins"
      },
      theme: {
        light: "Light mode",
        dark: "Dark mode"
      },
      language: {
        label: "Language"
      },
      dataset: {
        title: "Datasets",
        import: "Import .xlsx",
        dropHint: "Drop a dataset (.xlsx)",
        empty: "No dataset loaded"
      },
      modal: {
        close: "Close"
      }
    }
  },
  ko: {
    translation: {
      workspace: {
        title: "데이터 워크스페이스",
        variablePanel: "전역 변수",
        noVariable: "변수가 없습니다"
      },
      sidebar: {
        settings: "설정",
        plugins: "플러그인"
      },
      theme: {
        light: "라이트 모드",
        dark: "다크 모드"
      },
      language: {
        label: "언어"
      },
      dataset: {
        title: "데이터셋",
        import: ".xlsx 가져오기",
        dropHint: "데이터셋(.xlsx)을 드롭하세요",
        empty: "데이터셋이 없습니다"
      },
      modal: {
        close: "닫기"
      }
    }
  }
} as Record<string, { translation: Record<string, unknown> }>;

for (const lang of SUPPORTED_LANGUAGES) {
  if (!resources[lang]) {
    resources[lang] = resources.en;
  }
}

export function initWorkspaceI18n() {
  if (i18n.isInitialized) {
    return i18n;
  }

  i18n.use(initReactI18next).init({
    resources: resources as unknown as typeof resources,
    lng: "en",
    fallbackLng: "en",
    defaultNS: "translation",
    interpolation: {
      escapeValue: false
    }
  });

  return i18n;
}

export default i18n;
